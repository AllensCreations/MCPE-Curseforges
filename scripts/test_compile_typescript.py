#!/usr/bin/env python3
"""Tests for TypeScript support and scripts/compile_typescript.py."""
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import compile_typescript as cts  # noqa: E402
import build_payload as bp  # noqa: E402


class TestTypeScriptSupport(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp(prefix="ts-test-"))

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_compile_valid_ts(self):
        ts_file = self.tmp / "main.ts"
        ts_file.write_text(
            '// Sample comment\nimport { world } from "@minecraft/server";\nexport const answer: number = 42;\n',
            encoding="utf-8"
        )
        ok, msg = cts.compile_ts_files([ts_file], root=ROOT)
        self.assertTrue(ok, f"Compilation failed: {msg}")
        js_file = self.tmp / "main.js"
        self.assertTrue(js_file.is_file(), "main.js was not emitted")
        content = js_file.read_text(encoding="utf-8")
        self.assertIn("answer = 42", content)
        self.assertNotIn("Sample comment", content, "Comments were not stripped")

    def test_compile_type_error(self):
        ts_file = self.tmp / "bad.ts"
        ts_file.write_text(
            'const num: number = "this is a string";\n',
            encoding="utf-8"
        )
        ok, msg = cts.compile_ts_files([ts_file], root=ROOT)
        self.assertFalse(ok, "Type error was not detected")
        self.assertIn("error TS2322", msg)
        self.assertFalse((self.tmp / "bad.js").is_file(), "bad.js was emitted despite type error")

    def test_build_payload_accepts_ts(self):
        bp_dir = self.tmp / "behavior_pack"
        scripts_dir = bp_dir / "scripts"
        scripts_dir.mkdir(parents=True)
        (scripts_dir / "lib").mkdir(parents=True)
        (scripts_dir / "lib" / "README.md").write_text("# Lib\n", encoding="utf-8")
        (self.tmp / "project.json").write_text(
            '{"type": "script", "name": "TS-Test"}\n', encoding="utf-8"
        )
        (self.tmp / "README.md").write_text(
            '# TS-Test\n\nDownload: [TS-Test (v1)](https://github.com/AllensCreations/MCPE-Curseforges)\n',
            encoding="utf-8"
        )
        (self.tmp / "DESCRIPTION.md").write_text(
            '# TS-Test\n\n![Minecraft Bedrock](https://img.shields.io/badge/Minecraft-Bedrock-green)\n![Format](https://img.shields.io/badge/Format-.MCADDON-blue)\n\n## Overview\nA test project.\n\n## Features\nNone.\n\n## Installation\n1. Download.\n\n## Guidelines\nAttribution.\n',
            encoding="utf-8"
        )
        (self.tmp / "CHANGELOG.md").write_text(
            '# Changelog\n\n---\n\n## [v1] - 2026-01-01 - First Release\n\n### Added\n- **TS**: Initial release.\n',
            encoding="utf-8"
        )
        (bp_dir / "manifest.json").write_text(
            '{\n  "format_version": 2,\n  "header": {\n    "name": "TS-Test (v1.0.0)",\n    "description": "by ALNStudios",\n    "uuid": "4c3b5a7a-6f1e-4b2a-8c3d-1a2b3c4d5e6f",\n    "version": [1, 0, 0],\n    "min_engine_version": [1, 21, 0]\n  },\n  "modules": [\n    {\n      "type": "script",\n      "language": "javascript",\n      "uuid": "5d4c6b8b-7f2e-4c3b-9d4e-2b3c4d5e6f7a",\n      "version": [1, 0, 0],\n      "entry": "scripts/main.js"\n    }\n  ],\n  "dependencies": [\n    {\n      "module_name": "@minecraft/server",\n      "version": "1.15.0"\n    }\n  ],\n  "metadata": {\n    "authors": ["ALNStudios"],\n    "product_type": "addon"\n  }\n}\n',
            encoding="utf-8"
        )
        (scripts_dir / "main.ts").write_text(
            'import { world } from "@minecraft/server";\nexport function run(): void {}\n',
            encoding="utf-8"
        )
        # Pre-compile so entry file main.js is present for manifest validation if needed
        ok, msg = cts.compile_ts_files([scripts_dir / "main.ts"], root=ROOT)
        self.assertTrue(ok, f"Pre-compilation failed: {msg}")
        self.assertTrue((scripts_dir / "main.js").is_file(), "main.js was not emitted")

        fails, warns, count, total = bp.run_checks(self.tmp, repo_root=ROOT)
        non_doc_fails = [f for f in fails if not f.startswith("DOC:")]
        self.assertEqual(non_doc_fails, [], f"Non-DOC checks failed: {non_doc_fails}")


if __name__ == "__main__":
    unittest.main()
