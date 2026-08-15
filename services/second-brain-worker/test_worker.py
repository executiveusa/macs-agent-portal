import importlib.util
import json
import os
import tempfile
import unittest
import zipfile
from pathlib import Path

os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role")

SPEC = importlib.util.spec_from_file_location("maxx_second_brain_worker", Path(__file__).with_name("worker.py"))
worker = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(worker)


class SecondBrainWorkerTests(unittest.TestCase):
    def test_zip_builds_icm_and_okf_bundle_with_provenance(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            archive = root / "export.zip"
            with zipfile.ZipFile(archive, "w") as z:
                z.writestr("conversations.json", json.dumps({"title": "Client notes", "messages": ["Remember the fundraiser date"]}))
                z.writestr("notes/readme.md", "# Important\nThe website launch follows the interview.")
                z.writestr("images/photo.png", b"not-a-real-image")

            destination = root / "bundle"
            manifest = worker.build_bundle(
                {
                    "id": "11111111-1111-1111-1111-111111111111",
                    "user_id": "22222222-2222-2222-2222-222222222222",
                    "original_name": "export.zip",
                },
                archive,
                destination,
            )

            self.assertTrue((destination / "CONTEXT.md").exists())
            self.assertTrue((destination / "index.md").exists())
            self.assertTrue((destination / "_catalog" / "catalog.json").exists())
            self.assertEqual(manifest["stats"]["files"], 3)
            self.assertEqual(manifest["stats"]["text_files_indexed"], 2)
            self.assertGreaterEqual(manifest["stats"]["knowledge_concepts"], 2)

            concepts = list((destination / "knowledge" / "sources").glob("*.md"))
            self.assertTrue(concepts)
            concept = concepts[0].read_text(encoding="utf-8")
            self.assertTrue(concept.startswith("---\ntype: Source Document"))
            self.assertIn("generated: { by: process:maxx-second-brain-worker", concept)
            self.assertIn("sources:", concept)
            self.assertIn("Imported automatically", concept)

    def test_zip_traversal_is_not_extracted(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            archive = root / "unsafe.zip"
            with zipfile.ZipFile(archive, "w") as z:
                z.writestr("../escape.txt", "nope")
                z.writestr("safe.txt", "yes")
            destination = root / "sources"
            worker.safe_extract_zip(archive, destination)
            self.assertFalse((root / "escape.txt").exists())
            self.assertTrue((destination / "safe.txt").exists())

    def test_safe_name_removes_paths(self):
        self.assertEqual(worker.safe_name("../../customer/export.zip"), "export.zip")


if __name__ == "__main__":
    unittest.main()
