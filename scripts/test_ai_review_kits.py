#!/usr/bin/env python3
"""AI review kits: directory map + skills only, runnable scripts in a zip, no generated views in pack exports."""
import os
import re
import subprocess
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
REPO = SCRIPTS.parent
MAX_KIT_TXT = 40_000


def collect(paths, out, **env):
    e = dict(os.environ, PATHS=paths, AI_OUT=str(out), PYTHONDONTWRITEBYTECODE="1", **env)
    r = subprocess.run([sys.executable, str(SCRIPTS / "collect_ai_review.py")], cwd=REPO, env=e, capture_output=True, text=True)
    return r.returncode, r.stdout + r.stderr


class KitTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.out = Path(self.tmp.name)

    def tearDown(self):
        self.tmp.cleanup()

    def kit(self, kw):
        rc, log = collect(kw, self.out / kw)
        self.assertEqual(rc, 0, log)
        return self.out / kw

    def test_kits_have_no_file_contents(self):
        for kw, label in (("NEW", "New-Pack"), ("UPDATE", "Update-Pack"), ("REPO", "Repo-Maintenance")):
            d = self.kit(kw)
            txt = (d / f"{label}_tools.txt").read_text(encoding="utf-8")
            self.assertLess(len(txt.encode()), MAX_KIT_TXT, label)
            self.assertNotIn("## FILE:", txt, label)
            self.assertNotIn("def main(", txt, label)
            self.assertIn("## Directories", txt)
            self.assertIn("## Skill: .agents/skills/mcpe-context7/SKILL.md", txt)
            self.assertNotIn("Not found", txt, label)

    def test_directory_map_lists_directories_only(self):
        txt = (self.kit("UPDATE") / "Update-Pack_tools.txt").read_text(encoding="utf-8")
        block = txt.split("## Directories", 1)[1].split("## Skill:", 1)[0]
        for line in block.strip().splitlines():
            if line.startswith("- "):
                self.assertRegex(line, r"^- `[^`]+/` \(\d+ (files?|projects?)\)")

    def test_update_kit_differs_from_new_kit(self):
        new = (self.kit("NEW") / "New-Pack_tools.txt").read_text(encoding="utf-8")
        upd = (self.kit("UPDATE") / "Update-Pack_tools.txt").read_text(encoding="utf-8")
        self.assertNotEqual(new, upd)
        self.assertIn("mcpe-pack-update/SKILL.md", upd)
        self.assertIn("mcpe-new-pack/SKILL.md", new)

    def test_zip_has_complete_runnable_scripts(self):
        want = {"NEW": ("New-Pack", ["scripts/build_payload.py", "scripts/make_pack_script.py"]),
                "UPDATE": ("Update-Pack", ["scripts/make_update_script.py", "scripts/apply_update.py"])}
        for kw, (label, rels) in want.items():
            with zipfile.ZipFile(self.kit(kw) / f"{label}_files.zip") as z:
                for rel in rels:
                    self.assertEqual(z.read("files/" + rel), (REPO / rel).read_bytes(), rel)

    def test_kits_are_deterministic(self):
        a = (self.kit("UPDATE") / "Update-Pack_files.zip").read_bytes()
        rc, log = collect("UPDATE", self.out / "again")
        self.assertEqual(rc, 0, log)
        self.assertEqual(a, (self.out / "again" / "Update-Pack_files.zip").read_bytes())

    def test_pack_export_has_no_generated_views(self):
        pack = next((p for p in sorted((REPO / "MCPEDL" / "Addons").iterdir()) if (p / "CHANGELOG.md").is_file()), None)
        if pack is None:
            self.skipTest("no pack in this checkout")
        rel = pack.relative_to(REPO).as_posix()
        rc, log = collect(rel, self.out / "pack")
        self.assertEqual(rc, 0, log)
        txt = (self.out / "pack" / f"{pack.name}.txt").read_text(encoding="utf-8")
        self.assertNotRegex(txt, r"(?m)^## FILE: (changelog_views|Package)/")
        self.assertNotIn(".curseforge.html", txt)
        self.assertIn("single Context7 query", txt)
        self.assertEqual(len(re.findall(r"(?m)^## Reply Format", txt)), 1)


if __name__ == "__main__":
    unittest.main()
