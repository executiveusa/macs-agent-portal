#!/usr/bin/env python3
"""Narrow MCP bridge from isolated MAXX Hermes to the MAXX control plane.

This is intentionally not a general HTTP client. It exposes a fixed set of
team, federation and sandbox operations and carries a dedicated server-side
credential. The control plane remains the authority for operator scope,
one-hop delegation, approvals, emergency locks, persistence, mutation policy,
MAXX Migrations federation credentials, and sandbox access.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("maxx-control-plane")

BASE_URL = os.environ.get("MAXX_CONTROL_PLANE_INTERNAL_URL", "http://maxx-control-plane:8787").rstrip("/")
TOOL_KEY = os.environ.get("MAXX_HERMES_TOOL_KEY", "")


def _request(method: str, path: str, payload: dict[str, Any] | None = None) -> Any:
    if not TOOL_KEY:
        raise RuntimeError("MAXX_HERMES_TOOL_KEY is not configured")
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        f"{BASE_URL}{path}",
        method=method,
        data=body,
        headers={
            "content-type": "application/json",
            "x-maxx-hermes-tool-key": TOOL_KEY,
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"MAXX control plane rejected {method} {path}: HTTP {exc.code}: {detail[:1000]}") from exc


def _pups() -> list[dict[str, Any]]:
    payload = _request("GET", "/v1/pups")
    return list(payload.get("pups", []))


def _find_pup(name: str) -> dict[str, Any]:
    wanted = name.strip().casefold()
    pups = _pups()
    matches = [pup for pup in pups if str(pup.get("name", "")).casefold() == wanted]
    if len(matches) != 1:
        available = ", ".join(str(pup.get("name", "Pup")) for pup in pups)
        raise RuntimeError(f"Expected exactly one Pup named {name!r}. Available Pups: {available or 'none'}")
    pup = matches[0]
    if pup.get("status") != "active":
        raise RuntimeError(f"{pup.get('name', name)} is not active")
    return pup


def _chief_pup() -> dict[str, Any]:
    chiefs = [pup for pup in _pups() if pup.get("kind") == "chief_of_staff" and pup.get("status") == "active"]
    if len(chiefs) != 1:
        raise RuntimeError("MAXX requires exactly one active Chief Pup before automatic delegation can run")
    return chiefs[0]


def _pup_workspace_id(pup: dict[str, Any]) -> str:
    kind = str(pup.get("kind", ""))
    builtins = {
        "chief_of_staff": "chief-pup",
        "superdoer": "superdoer",
        "business_in_a_box": "business-pup",
    }
    if kind in builtins:
        return builtins[kind]
    raw = str(pup.get("id", "custom-pup")).replace("-", "")[:32].lower()
    return f"custom-{raw}"


@mcp.tool()
def maxx_migrations_health() -> str:
    """Check the canonical MAXX Migrations/ICM backend through the governed control plane."""
    return json.dumps(_request("GET", "/v1/migrations/health"), ensure_ascii=False)


@mcp.tool()
def maxx_migrations_manifest() -> str:
    """Read the canonical ICM federation, repository ownership, evidence states and motion gate."""
    return json.dumps(_request("GET", "/v1/migrations/manifest"), ensure_ascii=False)


@mcp.tool()
def maxx_migrations_route(condition: str) -> str:
    """Route a business condition through the canonical Reset/Momentum/Scale/Launch backend."""
    cleaned = condition.strip()
    if not cleaned:
        raise RuntimeError("condition is required")
    return json.dumps(
        _request("POST", "/v1/migrations/route", {"condition": cleaned}),
        ensure_ascii=False,
    )


@mcp.tool()
def list_pups() -> str:
    """List Stacy's named Pups and their current status. Use this before choosing a specialist."""
    pups = [
        {
            "name": pup.get("name"),
            "kind": pup.get("kind"),
            "status": pup.get("status"),
            "objective": pup.get("objective"),
        }
        for pup in _pups()
    ]
    return json.dumps({"pups": pups}, ensure_ascii=False)


@mcp.tool()
def hand_work_to_pup(target_pup_name: str, objective: str, expected_proof: str) -> str:
    """Hand one bounded task from the active Chief Pup to one active named Pup.

    This tool is one-hop only. The receiving Pup cannot re-delegate the task or
    expand permissions. Consequential external actions remain approval-gated.
    """
    source = _chief_pup()
    target = _find_pup(target_pup_name)
    instruction = "\n".join(
        [
            objective.strip(),
            f"Expected proof: {expected_proof.strip()}",
            "This work came through the governed Chief Pup tool. Return evidence or stop at the existing MAXX approval boundary.",
        ]
    )
    payload = _request(
        "POST",
        "/v1/pup-handoffs",
        {
            "sourcePupId": source["id"],
            "targetPupId": target["id"],
            "instruction": instruction,
        },
    )
    return json.dumps(payload, ensure_ascii=False)


@mcp.tool()
def fresh_specialist(target_pup_name: str, role: str, objective: str, expected_proof: str, context: str = "") -> str:
    """Give a named specialist Pup one fresh-context, one-shot task.

    The task packet is treated as complete context for this run. This does not
    create a recursive agent tree; it is still a single governed Pup handoff.
    """
    source = _chief_pup()
    target = _find_pup(target_pup_name)
    instruction = "\n".join(
        [
            "ONE-SHOT FRESH SPECIALIST TASK.",
            f"Temporary role: {role.strip()}",
            f"Objective: {objective.strip()}",
            f"Task packet: {context.strip() or 'No extra context supplied.'}",
            f"Expected proof: {expected_proof.strip()}",
            "Treat this packet as the complete task context. Do not rely on earlier chat context, do not delegate again, and do not expand permissions.",
        ]
    )
    payload = _request(
        "POST",
        "/v1/pup-handoffs",
        {
            "sourcePupId": source["id"],
            "targetPupId": target["id"],
            "instruction": instruction,
        },
    )
    return json.dumps(payload, ensure_ascii=False)


@mcp.tool()
def sandbox_status() -> str:
    """Show the capabilities of MAXX's self-hosted scratch computer.

    This is the sovereign replacement for Orgo's shared cloud computer. It has
    no production credentials, Docker socket, or VPS host filesystem mounted.
    """
    return json.dumps(_request("GET", "/v1/sandbox/capabilities"), ensure_ascii=False)


@mcp.tool()
def sandbox_list_files(pup_name: str, path: str = ".") -> str:
    """List files in one Pup's isolated persistent sandbox workspace."""
    pup = _find_pup(pup_name)
    query = urllib.parse.urlencode({"pupId": _pup_workspace_id(pup), "path": path})
    return json.dumps(_request("GET", f"/v1/sandbox/files/list?{query}"), ensure_ascii=False)


@mcp.tool()
def sandbox_read_file(pup_name: str, path: str) -> str:
    """Read a UTF-8 file from one Pup's isolated persistent sandbox workspace."""
    pup = _find_pup(pup_name)
    query = urllib.parse.urlencode({"pupId": _pup_workspace_id(pup), "path": path})
    return json.dumps(_request("GET", f"/v1/sandbox/files/read?{query}"), ensure_ascii=False)


@mcp.tool()
def sandbox_write_file(pup_name: str, path: str, content: str) -> str:
    """Write a UTF-8 file into one Pup's isolated sandbox workspace.

    This never writes to the VPS host filesystem or production repositories.
    """
    pup = _find_pup(pup_name)
    return json.dumps(
        _request("POST", "/v1/sandbox/files/write", {"pupId": _pup_workspace_id(pup), "path": path, "content": content}),
        ensure_ascii=False,
    )


@mcp.tool()
def sandbox_exec(pup_name: str, command: str, cwd: str = ".") -> str:
    """Run a bounded shell command inside one Pup's isolated MAXX sandbox.

    Use for scratch computation, transforms, local file work, git inspection,
    and reproducible experiments. The sandbox intentionally has no customer or
    provider secrets. Consequential external actions must use the dedicated
    MAXX connectors/approval paths instead of trying to smuggle credentials
    into this workspace.
    """
    pup = _find_pup(pup_name)
    return json.dumps(
        _request("POST", "/v1/sandbox/exec", {"pupId": _pup_workspace_id(pup), "command": command, "cwd": cwd}),
        ensure_ascii=False,
    )


@mcp.tool()
def propose_refinement(observation: str, proposed_change: str, expected_evidence: str, rollback_plan: str) -> str:
    """Propose an evidence-backed MAXX improvement. This can never apply the change itself."""
    payload = _request(
        "POST",
        "/v1/refinements",
        {
            "source": "Hermes/Chief Pup",
            "observation": observation.strip(),
            "proposedChange": proposed_change.strip(),
            "expectedEvidence": expected_evidence.strip(),
            "rollbackPlan": rollback_plan.strip(),
        },
    )
    return json.dumps(payload, ensure_ascii=False)


if __name__ == "__main__":
    mcp.run()
