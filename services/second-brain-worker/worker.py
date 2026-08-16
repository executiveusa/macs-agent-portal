#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import re
import shutil
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SERVICE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
ICM_ROOT = Path(os.environ.get("MAXX_ICM_ROOT", "/data/maxx"))
POLL_SECONDS = max(2, int(os.environ.get("SECOND_BRAIN_POLL_SECONDS", "5")))
BUCKET = "maxx-second-brain"
MAX_TEXT_BYTES = int(os.environ.get("SECOND_BRAIN_MAX_TEXT_BYTES", str(10 * 1024 * 1024)))
CHUNK_CHARS = int(os.environ.get("SECOND_BRAIN_CHUNK_CHARS", "60000"))
TEXT_SUFFIXES = {
    ".txt", ".md", ".markdown", ".json", ".jsonl", ".csv", ".tsv", ".html", ".htm",
    ".xml", ".yaml", ".yml", ".log", ".sql", ".py", ".js", ".ts", ".tsx", ".jsx",
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def headers(extra: dict[str, str] | None = None) -> dict[str, str]:
    value = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
    }
    if extra:
        value.update(extra)
    return value


def rest(path: str, method: str = "GET", body: Any | None = None, prefer: str | None = None) -> Any:
    data = json.dumps(body).encode() if body is not None else None
    h = headers({"Prefer": prefer} if prefer else None)
    request = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/{path}", data=data, headers=h, method=method)
    with urllib.request.urlopen(request, timeout=30) as response:
        raw = response.read()
    return json.loads(raw) if raw else None


def claim_one() -> dict[str, Any] | None:
    rows = rest("maxx_second_brain_imports?status=eq.queued&select=*&order=created_at.asc&limit=1") or []
    if not rows:
        return None
    row = rows[0]
    claimed = rest(
        f"maxx_second_brain_imports?id=eq.{urllib.parse.quote(str(row['id']))}&status=eq.queued",
        method="PATCH",
        body={"status": "processing", "error": None},
        prefer="return=representation",
    ) or []
    return claimed[0] if claimed else None


def update_job(job_id: str, **values: Any) -> None:
    rest(
        f"maxx_second_brain_imports?id=eq.{urllib.parse.quote(job_id)}",
        method="PATCH",
        body=values,
        prefer="return=minimal",
    )


def safe_name(value: str) -> str:
    name = Path(value).name
    cleaned = re.sub(r"[^A-Za-z0-9._ -]+", "_", name).strip(" .")
    return cleaned[:180] or "second-brain-export.bin"


def download_chunk(path: str, destination: Path) -> int:
    encoded = "/".join(urllib.parse.quote(part, safe="") for part in path.split("/"))
    request = urllib.request.Request(
        f"{SUPABASE_URL}/storage/v1/object/authenticated/{BUCKET}/{encoded}",
        headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"},
    )
    size = 0
    with urllib.request.urlopen(request, timeout=120) as response, destination.open("wb") as out:
        while True:
            block = response.read(1024 * 1024)
            if not block:
                break
            size += len(block)
            out.write(block)
    return size


def reconstruct(job: dict[str, Any], tmp: Path) -> Path:
    assembled = tmp / safe_name(str(job["original_name"]))
    prefix = str(job["storage_prefix"]).strip("/")
    with assembled.open("wb") as output:
        for index in range(int(job["chunk_count"])):
            part = tmp / f"{index:06d}.part"
            download_chunk(f"{prefix}/{index:06d}.part", part)
            with part.open("rb") as source:
                shutil.copyfileobj(source, output, length=1024 * 1024)
            part.unlink(missing_ok=True)
    expected = int(job["total_bytes"])
    actual = assembled.stat().st_size
    if expected != actual:
        raise ValueError(f"reconstructed size mismatch: expected {expected}, got {actual}")
    return assembled


def safe_extract_zip(source: Path, destination: Path) -> None:
    destination.mkdir(parents=True, exist_ok=True)
    root = destination.resolve()
    with zipfile.ZipFile(source) as archive:
        for member in archive.infolist():
            candidate = (destination / member.filename).resolve()
            if root != candidate and root not in candidate.parents:
                continue
            if member.is_dir():
                candidate.mkdir(parents=True, exist_ok=True)
                continue
            candidate.parent.mkdir(parents=True, exist_ok=True)
            with archive.open(member) as src, candidate.open("wb") as dst:
                shutil.copyfileobj(src, dst, length=1024 * 1024)


def iter_sources(root: Path):
    for path in sorted(root.rglob("*")):
        if not path.is_file():
            continue
        if any(part.startswith(".") for part in path.relative_to(root).parts):
            continue
        yield path


def read_text(path: Path) -> str | None:
    if path.suffix.lower() not in TEXT_SUFFIXES:
        return None
    if path.stat().st_size > MAX_TEXT_BYTES:
        return None
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return None


def yaml_quote(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def write_okf_concept(destination: Path, title: str, relative_source: str, body: str, generated_at: str) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    frontmatter = [
        "---",
        "type: Source Document",
        f"title: {yaml_quote(title)}",
        f"description: {yaml_quote('Imported source from the customer second brain. Machine-indexed; not independently verified.')}",
        f"resource: {yaml_quote('source:' + relative_source)}",
        "tags: [second-brain, imported]",
        f"generated: {{ by: process:maxx-second-brain-worker, at: {generated_at} }}",
        "status: active",
        "sources:",
        f"  - resource: {yaml_quote('source:' + relative_source)}",
        f"    title: {yaml_quote(title)}",
        "---",
        "",
        f"# {title}",
        "",
        "> Imported automatically. Treat claims as source material until MAXX or a human verifies them against the original context.",
        "",
        body,
        "",
    ]
    destination.write_text("\n".join(frontmatter), encoding="utf-8")


def build_bundle(job: dict[str, Any], source: Path, destination: Path) -> dict[str, Any]:
    if destination.exists():
        shutil.rmtree(destination)
    sources_dir = destination / "sources"
    concepts_dir = destination / "knowledge" / "sources"
    sources_dir.mkdir(parents=True, exist_ok=True)
    concepts_dir.mkdir(parents=True, exist_ok=True)

    if zipfile.is_zipfile(source):
        safe_extract_zip(source, sources_dir)
    else:
        shutil.copy2(source, sources_dir / source.name)

    generated_at = now_iso()
    catalog: list[dict[str, Any]] = []
    text_count = 0
    concept_count = 0

    for path in iter_sources(sources_dir):
        rel = path.relative_to(sources_dir).as_posix()
        entry: dict[str, Any] = {
            "path": rel,
            "bytes": path.stat().st_size,
            "suffix": path.suffix.lower(),
            "text_indexed": False,
            "concepts": [],
        }
        text = read_text(path)
        if text is not None and text.strip():
            text_count += 1
            parts = [text[i : i + CHUNK_CHARS] for i in range(0, len(text), CHUNK_CHARS)] or [text]
            for index, part in enumerate(parts):
                slug = re.sub(r"[^a-zA-Z0-9_-]+", "-", rel).strip("-").lower()[:90] or "source"
                concept_name = f"{slug}-{index + 1:04d}.md" if len(parts) > 1 else f"{slug}.md"
                title = path.name if len(parts) == 1 else f"{path.name} — part {index + 1} of {len(parts)}"
                concept_path = concepts_dir / concept_name
                write_okf_concept(concept_path, title, rel, part, generated_at)
                entry["concepts"].append(concept_path.relative_to(destination).as_posix())
                concept_count += 1
            entry["text_indexed"] = True
        catalog.append(entry)

    catalog_dir = destination / "_catalog"
    catalog_dir.mkdir(parents=True, exist_ok=True)
    manifest = {
        "schema_version": "maxx-second-brain/1",
        "import_id": str(job["id"]),
        "user_id": str(job["user_id"]),
        "original_name": str(job["original_name"]),
        "generated_at": generated_at,
        "format": "ICM + Open Knowledge Format compatible markdown concepts",
        "sources": catalog,
        "stats": {
            "files": len(catalog),
            "text_files_indexed": text_count,
            "knowledge_concepts": concept_count,
        },
    }
    (catalog_dir / "catalog.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")

    index_lines = [
        "---",
        "type: Knowledge Bundle",
        f"title: {yaml_quote('MAXX second brain — ' + str(job['original_name']))}",
        f"description: {yaml_quote('Portable customer knowledge bundle generated from an uploaded export.')}",
        "tags: [second-brain, maxx, icm, okf]",
        f"generated: {{ by: process:maxx-second-brain-worker, at: {generated_at} }}",
        "status: active",
        "---",
        "",
        "# Second brain knowledge bundle",
        "",
        "This directory is a progressive-disclosure catalog. MAXX should read this index first, then load only relevant concepts.",
        "",
        "## Indexed sources",
    ]
    for entry in catalog:
        if entry["concepts"]:
            links = ", ".join(f"[{Path(c).name}](/{c})" for c in entry["concepts"])
            index_lines.append(f"- `{entry['path']}` -> {links}")
        else:
            index_lines.append(f"- `{entry['path']}` — binary or unsupported text format; retained in `sources/` but not loaded into prompts by default")
    (destination / "index.md").write_text("\n".join(index_lines) + "\n", encoding="utf-8")

    context = [
        "# Customer second brain — ICM context",
        "",
        "## Purpose",
        "One job: give MAXX portable customer knowledge without context stuffing.",
        "",
        "## Inputs",
        "- Working: the customer's current question/mission.",
        "- Reference: `index.md` and `_catalog/catalog.json`.",
        "",
        "Do not load the whole bundle. Follow `index.md`, select the smallest relevant concepts, and preserve source provenance.",
        "",
        "## Process",
        "1. Search titles/paths/tags first.",
        "2. Read only the relevant `knowledge/` concept files.",
        "3. When a claim matters, distinguish imported source content from independently verified fact.",
        "4. Link new durable knowledge to one authoritative home rather than copying it repeatedly.",
        "",
        "## Outputs",
        "Mission-specific answers, decisions, or new curated knowledge artifacts outside the immutable imported source snapshot.",
        "",
        "## Human check",
        "A user can ask MAXX about prior exported context and MAXX can point back to the source concept/path used.",
    ]
    (destination / "CONTEXT.md").write_text("\n".join(context) + "\n", encoding="utf-8")
    return manifest


def process(job: dict[str, Any]) -> None:
    import_id = str(job["id"])
    user_id = str(job["user_id"])
    destination = ICM_ROOT / "second-brain" / user_id / import_id
    with tempfile.TemporaryDirectory(prefix="maxx-brain-") as temp_dir:
        assembled = reconstruct(job, Path(temp_dir))
        manifest = build_bundle(job, assembled, destination)
    update_job(
        import_id,
        status="ready",
        manifest_path=str((destination / "_catalog" / "catalog.json").relative_to(ICM_ROOT)),
        error=None,
    )
    print(json.dumps({"event": "second_brain.ready", "import_id": import_id, "stats": manifest["stats"]}), flush=True)


def main() -> None:
    (ICM_ROOT / "second-brain").mkdir(parents=True, exist_ok=True)
    print(json.dumps({"event": "second_brain.worker_started", "poll_seconds": POLL_SECONDS}), flush=True)
    while True:
        try:
            job = claim_one()
            if not job:
                time.sleep(POLL_SECONDS)
                continue
            try:
                process(job)
            except Exception as exc:  # record failure, then continue serving other imports
                update_job(str(job["id"]), status="failed", error=str(exc)[:2000])
                print(json.dumps({"event": "second_brain.failed", "import_id": str(job["id"]), "error": str(exc)}), flush=True)
        except urllib.error.HTTPError as exc:
            print(json.dumps({"event": "second_brain.poll_http_error", "status": exc.code}), flush=True)
            time.sleep(POLL_SECONDS)
        except Exception as exc:
            print(json.dumps({"event": "second_brain.poll_error", "error": str(exc)}), flush=True)
            time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    main()
