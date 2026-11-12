#!/usr/bin/env python3
"""Regression tests for Delete Package (scripts/delete_project.py)."""
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import delete_project as dp

ROOT_README = """# Collection

[![Collection Size](https://img.shields.io/badge/Collection-2%20Add--ons%20%7C%200%20Maps%20%7C%200%20Scripts%20%7C%200%20Minigames-orange?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)

## Add-ons Catalog

| Name | Type | Download | Source | About |
| :--- | :--- | :--- | :--- | :--- |
| **Mining Helmet** | Add-on (.mcaddon) | [Download (.mcaddon)](https://x/raw/main/builds/Mining-Helmet/a.mcaddon) | [`MCPEDL/Addons/Mining-Helmet/`](https://x/tree/main/MCPEDL/Addons/Mining-Helmet/) | Light |
| **Universal Leash** | Add-on (.mcaddon) | [Download (.mcaddon)](https://x/raw/main/builds/Universal-Leash/b.mcaddon) | [`MCPEDL/Addons/Universal-Leash/`](https://x/tree/main/MCPEDL/Addons/Universal-Leash/) | Leash |

## Overview

### Add-on: Mining Helmet

A helmet. See `MCPEDL/Addons/Mining-Helmet/`.

---

### Add-on: Universal Leash

Works nicely with [Mining Helmet](https://x/tree/main/MCPEDL/Addons/Mining-Helmet/).
"""

CATEGORY_README = """# Add-ons

## Available Add-ons

| Add-on | Source | Download |
| :--- | :--- | :--- |
| Mining Helmet | [Source](https://x/tree/main/MCPEDL/Addons/Mining-Helmet/) | [MCADDON](https://x/raw/main/builds/Mining-Helmet/a.mcaddon) |
| Universal Leash | [Source](https://x/tree/main/MCPEDL/Addons/Universal-Leash/) | [MCADDON](https://x/raw/main/builds/Universal-Leash/b.mcaddon) |
"""

BUILDS_README = """# Builds

### Add-on Packs

| Pack | Type | Download | Folder |
| :--- | :--- | :--- | :--- |
| **Mining Helmet** | Add-on (.mcaddon) | [Download (.mcaddon)](Mining-Helmet/a.mcaddon) | [`Mining-Helmet/`](https://x/tree/main/builds/Mining-Helmet/) |
| **Universal Leash** | Add-on (.mcaddon) | [Download (.mcaddon)](Universal-Leash/b.mcaddon) | [`Universal-Leash/`](https://x/tree/main/builds/Universal-Leash/) |
"""


class DeletePackageTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        for name in ("Mining-Helmet", "Universal-Leash"):
            (self.root / "MCPEDL/Addons" / name).mkdir(parents=True)
            (self.root / "MCPEDL/Addons" / name / "DESCRIPTION.md").write_text(
                f"# {name.replace('-', ' ')}\n", encoding="utf-8")
            (self.root / "builds" / name / "versions/V1.0.0").mkdir(parents=True)
            (self.root / "builds" / name / "x.mcaddon").write_text("zip")
            (self.root / "changelog_views").mkdir(exist_ok=True)
            (self.root / "changelog_views" / f"{name}.github.md").write_text("g")
            (self.root / "changelog_views" / f"{name}.curseforge.html").write_text("c")
        (self.root / "MCPEDL/Maps/Mining-Helmet-Map").mkdir(parents=True)
        (self.root / "MCPEDL/Addons/README.md").write_text(CATEGORY_README, encoding="utf-8")
        (self.root / "builds/README.md").write_text(BUILDS_README, encoding="utf-8")
        (self.root / "README.md").write_text(ROOT_README, encoding="utf-8")
        (self.root / "builds/Curseforge_IDs.json").write_text(json.dumps({
            "MCPEDL/Addons/Mining-Helmet": {"project_id": "1"},
            "MCPEDL/Addons/Universal-Leash": {"project_id": "2"},
        }, indent=2) + "\n")

        mcpedl = self.root / "MCPEDL"
        self.patches = [
            patch.object(dp, "REPO_ROOT", str(self.root)),
            patch.object(dp, "MCPEDL_DIR", str(mcpedl)),
            patch.object(dp, "BUILDS_DIR", str(self.root / "builds")),
            patch.object(dp, "VIEWS_DIR", str(self.root / "changelog_views")),
            patch.object(dp, "ROOT_README", str(self.root / "README.md")),
            patch.object(dp, "BUILDS_README", str(self.root / "builds/README.md")),
            patch.object(dp, "WORLDS_README", str(self.root / "Mcpeworlds/README.md")),
            patch.object(dp, "REGISTRY", str(self.root / "builds/Curseforge_IDs.json")),
            patch.object(dp, "CATEGORY_MAP", {k: str(mcpedl / v) for k, v in dp.CATEGORY_DIRS.items()}),
            patch.object(dp, "sync_publish_dropdown"),
        ]
        for p in self.patches:
            p.start()

    def tearDown(self):
        for p in self.patches:
            p.stop()
        self.temp.cleanup()

    def test_resolve_accepts_name_category_and_full_path_in_any_case(self):
        for text in ("Mining-Helmet", "mining-helmet", "Addons/Mining-Helmet", "MCPEDL/Addons/Mining-Helmet",
                     "mcpedl/addons/mining-helmet/", "./MCPEDL/Addons/Mining-Helmet"):
            self.assertEqual(dp.resolve_package(text), ("addons", "Mining-Helmet"), text)

    def test_resolve_rejects_unknown_traversal_and_bad_category(self):
        for text in ("", "Nope", "../etc", "MCPEDL/Addons/../Maps", "Cars/Mining-Helmet"):
            with self.assertRaises(ValueError, msg=text):
                dp.resolve_package(text)

    def test_deletes_package_and_every_affected_thing(self):
        ok, removed, _ = dp.delete_project("addons", "Mining-Helmet")
        self.assertTrue(ok)
        self.assertFalse((self.root / "MCPEDL/Addons/Mining-Helmet").exists())
        self.assertFalse((self.root / "builds/Mining-Helmet").exists())
        self.assertFalse((self.root / "changelog_views/Mining-Helmet.github.md").exists())
        self.assertFalse((self.root / "changelog_views/Mining-Helmet.curseforge.html").exists())
        registry = json.loads((self.root / "builds/Curseforge_IDs.json").read_text())
        self.assertEqual(list(registry), ["MCPEDL/Addons/Universal-Leash"])
        for readme in ("README.md", "builds/README.md", "MCPEDL/Addons/README.md"):
            text = (self.root / readme).read_text()
            self.assertNotIn("| **Mining Helmet**", text, readme)
            self.assertNotIn("| Mining Helmet |", text, readme)
            self.assertIn("Universal", text, readme)
        root = (self.root / "README.md").read_text()
        self.assertNotIn("### Add-on: Mining Helmet", root)
        self.assertIn("### Add-on: Universal Leash", root)
        self.assertIn("1%20Add--ons", root)
        self.assertTrue(any("Curseforge_IDs.json" in item for item in removed))
        dp.sync_publish_dropdown.assert_called_once()

    def test_other_packages_and_lookalike_names_are_untouched(self):
        dp.delete_project("addons", "Mining-Helmet")
        self.assertTrue((self.root / "MCPEDL/Addons/Universal-Leash").is_dir())
        self.assertTrue((self.root / "builds/Universal-Leash/x.mcaddon").is_file())
        self.assertTrue((self.root / "MCPEDL/Maps/Mining-Helmet-Map").is_dir())
        self.assertTrue((self.root / "changelog_views/Universal-Leash.github.md").is_file())

    def test_mention_inside_another_package_is_reported_not_deleted(self):
        _, _, warnings = dp.delete_project("addons", "Mining-Helmet")
        self.assertIn("Works nicely with", (self.root / "README.md").read_text())
        self.assertIn("README.md:1", [w for w in warnings if w.startswith("README.md")][0] + ":1")

    def test_dry_run_changes_nothing(self):
        before = (self.root / "README.md").read_text()
        ok, removed, _ = dp.delete_project("addons", "Mining-Helmet", dry_run=True)
        self.assertTrue(ok)
        self.assertEqual(removed, [])
        self.assertTrue((self.root / "MCPEDL/Addons/Mining-Helmet").is_dir())
        self.assertEqual((self.root / "README.md").read_text(), before)

    def test_unknown_package_fails_without_touching_anything(self):
        ok, _, _ = dp.delete_project("addons", "Nope")
        self.assertFalse(ok)
        self.assertTrue((self.root / "MCPEDL/Addons/Mining-Helmet").is_dir())

    def test_main_requires_confirm_yes(self):
        self.assertEqual(dp.main(["--package", "Mining-Helmet"]), 0)
        self.assertTrue((self.root / "MCPEDL/Addons/Mining-Helmet").is_dir())
        with patch.dict(os.environ, {}, clear=False):
            self.assertEqual(dp.main(["--package", "mining-helmet", "--confirm", "yes"]), 0)
        self.assertFalse((self.root / "MCPEDL/Addons/Mining-Helmet").exists())


if __name__ == "__main__":
    unittest.main()
