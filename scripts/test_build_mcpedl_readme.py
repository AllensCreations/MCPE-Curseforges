#!/usr/bin/env python3
"""Tests for scripts/build_mcpedl_readme.py."""
import json
import tempfile
import unittest
from pathlib import Path

import build_mcpedl_readme as bmr


class BuildMcpedlReadmeTests(unittest.TestCase):
    def test_norm_and_tuple(self):
        self.assertEqual(bmr._norm("6"), "v6")
        self.assertEqual(bmr._norm("1.2.3"), "1.2.3")
        self.assertEqual(bmr._tuple("v1"), (1, 0, 0))
        self.assertEqual(bmr._tuple("1.2.3"), (1, 2, 3))

    def test_pack_title_and_version(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            proj = root / "MCPEDL" / "Addons" / "Test-Pack"
            proj.mkdir(parents=True)
            (proj / "DESCRIPTION.md").write_text("# Test Pack — Subtitle\nBody", encoding="utf-8")
            (proj / "CHANGELOG.md").write_text("## [v2] - 2026-01-01\n- Note", encoding="utf-8")
            self.assertEqual(bmr.pack_title(proj), "Test Pack")
            self.assertEqual(bmr.pack_version(proj), "v2")

    def test_build_catalog_structure(self):
        with tempfile.TemporaryDirectory() as td:
            root = Path(td)
            proj = root / "MCPEDL" / "Addons" / "Test-Pack"
            proj.mkdir(parents=True)
            (proj / "DESCRIPTION.md").write_text("# Test Pack\n", encoding="utf-8")
            (proj / "CHANGELOG.md").write_text("## [v1]\n", encoding="utf-8")
            (root / "MCPEDL" / "AI Review").mkdir(parents=True)
            (root / "MCPEDL" / "AI Review" / "Test-Pack.txt").write_text("AI", encoding="utf-8")
            (root / "MCPEDL" / "AI Review" / "Test-Pack-v1.zip").write_text("ZIP", encoding="utf-8")
            (root / "Package").mkdir(parents=True)
            (root / "Package" / "Test-Pack.listing.md").write_text("Listing", encoding="utf-8")

            out, warnings = bmr.render(root)
            self.assertIn("# MCPEDL Catalog", out)
            self.assertIn("## Add-ons", out)
            self.assertIn("Test Pack", out)
            self.assertIn("Test-Pack-v1.zip", out)
            self.assertIn("Test-Pack.listing.md", out)


if __name__ == "__main__":
    unittest.main()
