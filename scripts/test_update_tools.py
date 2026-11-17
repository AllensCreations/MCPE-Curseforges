#!/usr/bin/env python3
"""Search-and-replace updates: exact, atomic, idempotent, one .sh."""
import os
import stat
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS))
import apply_update as au  # noqa: E402

CHANGELOG = "# Changelog — Demo\n\n---\n\n## [1.0.0] - 2026-01-01 - First\n\n### Added\n- **A**: b.\n"
ROOT_LOG = "# Changelog — repo\n\n---\n\n## 2026-01-01 - Old\n"
MAIN_JS = "const a = 1;\nconst b = 2;\nconst c = 3;\n"


def spec(*body, version="1.0.1"):
    return "\n".join(["@@ version " + version, "@@ project MCPEDL/Addons/Demo", *body,
                      "@@ changelog Tweak", "### Fixed", "- **Fix**: Better."])


class UpdateTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        p = self.root / "MCPEDL/Addons/Demo"
        (p / "behavior_pack").mkdir(parents=True)
        (p / "CHANGELOG.md").write_text(CHANGELOG, encoding="utf-8")
        (p / "behavior_pack/main.js").write_text(MAIN_JS, encoding="utf-8")
        (p / "behavior_pack/data.json").write_text('{"a": 1}\n', encoding="utf-8")
        (self.root / "CHANGELOG.md").write_text(ROOT_LOG, encoding="utf-8")
        self.p = p

    def tearDown(self):
        self.tmp.cleanup()

    def run_spec(self, text, dry=False):
        return au.run(au.parse(text), self.root, "2026-11-13", dry)

    def js(self):
        return (self.p / "behavior_pack/main.js").read_text(encoding="utf-8")

    def test_replace_insert_delete_append_create(self):
        notes, touched = self.run_spec(spec(
            "@@ file behavior_pack/main.js", "@@ replace", "const b = 2;", "@@ with", "const b = 20;",
            "@@ insert-after", "const a = 1;", "@@ with", "const a2 = 1;",
            "@@ insert-before", "const c = 3;", "@@ with", "const c0 = 0;",
            "@@ delete", "const c = 3;", "@@ append", "export {};",
            "@@ file behavior_pack/new.txt", "@@ create", "hello"))
        self.assertEqual(self.js(), "const a = 1;\nconst a2 = 1;\nconst b = 20;\nconst c0 = 0;\nexport {};\n")
        self.assertEqual((self.p / "behavior_pack/new.txt").read_text(), "hello\n")
        self.assertIn("## [1.0.1] - 2026-11-13 - Tweak", (self.p / "CHANGELOG.md").read_text())
        self.assertIn("## [v1] - 2026-11-13 - Tweak", (self.root / "CHANGELOG.md").read_text())

    def test_second_run_changes_nothing(self):
        s = spec("@@ file behavior_pack/main.js", "@@ replace", "const b = 2;", "@@ with", "const b = 20;")
        self.run_spec(s)
        before = self.js()
        _, touched = self.run_spec(s)
        self.assertEqual(self.js(), before)
        self.assertEqual(touched, [])

    def test_ambiguous_and_missing_text_fail_and_write_nothing(self):
        self.js_before = self.js()
        with self.assertRaises(au.Fail):
            self.run_spec(spec("@@ file behavior_pack/main.js", "@@ replace", "const", "@@ with", "let"))
        with self.assertRaises(au.Fail):
            self.run_spec(spec("@@ file behavior_pack/main.js", "@@ replace", "const b = 2;", "@@ with", "const b = 5;",
                               "@@ replace", "does not exist", "@@ with", "x"))
        self.assertEqual(self.js(), MAIN_JS)
        self.assertNotIn("1.0.1", (self.p / "CHANGELOG.md").read_text())

    def test_replace_all_and_json_check(self):
        self.run_spec(spec("@@ file behavior_pack/main.js", "@@ replace-all", "const ", "@@ with", "let "))
        self.assertEqual(self.js().count("let "), 3)
        with self.assertRaises(au.Fail) as cm:
            self.run_spec(spec("@@ file behavior_pack/data.json", "@@ replace", '"a": 1', "@@ with", '"a": '))
        self.assertEqual(cm.exception.code, 4)

    def test_stale_version_and_path_escape(self):
        with self.assertRaises(au.Fail) as cm:
            self.run_spec(spec("@@ file behavior_pack/main.js", "@@ append", "x", version="1.0.5"))
        self.assertEqual(cm.exception.code, 3)
        with self.assertRaises(au.Fail):
            self.run_spec(spec("@@ file ../Other/x.js", "@@ create", "x"))

    def test_builder_makes_one_sh_and_dry_run_verifies(self):
        sp = self.root / "spec.txt"
        sp.write_text(spec("@@ file behavior_pack/main.js", "@@ replace", "const b = 2;", "@@ with", "const b = 20;") + "\n")
        out = self.root / "out"
        r = subprocess.run([sys.executable, str(SCRIPTS / "make_update_script.py"), str(sp), "--rand", "abc12",
                            "--out-dir", str(out), "--verify", str(self.root)], capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertEqual([f.name for f in out.iterdir()], ["Demo_1.0.1_abc12.sh"])
        self.assertEqual(self.js(), MAIN_JS)
        bad = subprocess.run([sys.executable, str(SCRIPTS / "make_update_script.py"), str(sp), "--rand", "AB"],
                             capture_output=True, text=True)
        self.assertNotEqual(bad.returncode, 0)


    def test_repo_level_version_must_be_the_next_repo_version(self):
        (self.root / "REPO_VERSION").write_text("5\n")
        body = ["@@ project .", "@@ file note.txt", "@@ create", "hi", "@@ root-changelog Note", "### Fixed", "- **Fix**: x."]
        with self.assertRaises(au.Fail) as bad:
            self.run_spec("\n".join(["@@ version 9"] + body))
        self.assertEqual(bad.exception.code, 3)
        self.assertIn("@@ version 6", str(bad.exception))
        self.assertFalse((self.root / "note.txt").exists())
        self.run_spec("\n".join(["@@ version 6"] + body))
        self.assertEqual((self.root / "REPO_VERSION").read_text().strip(), "6")
        self.assertIn("## [v6] - 2026-11-13 - Note", (self.root / "CHANGELOG.md").read_text())

    def test_old_three_part_repo_version_continues_as_a_single_number(self):
        (self.root / "REPO_VERSION").write_text("1.0.79\n")
        body = ["@@ project .", "@@ file note.txt", "@@ create", "hi", "@@ root-changelog Note", "### Fixed", "- **Fix**: x."]
        with self.assertRaises(au.Fail) as bad:
            self.run_spec("\n".join(["@@ version 81"] + body))
        self.assertEqual(bad.exception.code, 3)
        self.assertIn("@@ version 80", str(bad.exception))
        self.run_spec("\n".join(["@@ version 80"] + body))
        self.assertEqual((self.root / "REPO_VERSION").read_text().strip(), "80")
        self.assertIn("## [v80] - 2026-11-13 - Note", (self.root / "CHANGELOG.md").read_text())

    def test_repo_level_script_is_named_with_a_v_and_project_versions_stay_three_part(self):
        sp = self.root / "spec.txt"
        out = self.root / "out"
        sp.write_text("@@ version 2\n@@ project .\n@@ file a.txt\n@@ create\nx\n@@ root-changelog Note\n### Fixed\n- **Fix**: x.\n")
        r = subprocess.run([sys.executable, str(SCRIPTS / "make_update_script.py"), str(sp), "--rand", "abc12",
                            "--out-dir", str(out)], capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertEqual([f.name for f in out.iterdir()], ["Repo_v2_abc12.sh"])
        with self.assertRaises(au.Fail):
            au.parse("@@ version 2\n@@ project MCPEDL/Addons/Demo\n")

    def test_delete_file_removes_tracked_files_and_older_apply_update_still_works(self):
        git = lambda *a: subprocess.run(["git", *a], cwd=self.root, capture_output=True, text=True, check=True)
        git("init", "-q")
        git("config", "user.email", "t@t")
        git("config", "user.name", "t")
        (self.root / "scripts").mkdir()
        (self.root / "scripts/old.py").write_text("x\n")
        (self.p / "test_world.json").write_text("{}\n")
        (self.p / "Demo - Test.mcworld").write_bytes(b"w")
        git("add", "-A")
        git("commit", "-q", "-m", "init")
        text = "\n".join(["@@ version 1.0.1", "@@ project .", "@@ delete-file scripts/old.py",
                          "@@ delete-file MCPEDL/*/*/test_world.json", "@@ delete-file MCPEDL/*/*/* - Test.mcworld",
                          "@@ delete-file scripts/missing.py", "@@ root-changelog Cleanup", "### Fixed", "- **Fix**: Gone."]) + "\n"
        sp = self.root / "spec.txt"
        sp.write_text(text)
        out = self.root / "out"
        r = subprocess.run([sys.executable, str(SCRIPTS / "make_update_script.py"), str(sp), "--rand", "abc12",
                            "--out-dir", str(out)], capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        sh = out / "Repo_1.0.1_abc12.sh"
        self.assertEqual(subprocess.run(["bash", "-n", str(sh)]).returncode, 0)
        body = sh.read_text()
        self.assertIn("grep -v '^@@ delete-file '", body)
        listing = subprocess.run(["bash", "-c", "cd \"$1\" && git ls-files -z -- \":(glob)$2\"", "_", str(self.root),
                                  "MCPEDL/*/*/* - Test.mcworld"], capture_output=True, text=True).stdout
        self.assertEqual(listing.strip("\0"), "MCPEDL/Addons/Demo/Demo - Test.mcworld")
        for bad in ("@@ delete-file ../x", "@@ delete-file /etc/passwd", "@@ delete-file :(top)x", "@@ delete-file a;b"):
            sp.write_text("@@ version 1.0.1\n@@ project .\n" + bad + "\n")
            r = subprocess.run([sys.executable, str(SCRIPTS / "make_update_script.py"), str(sp), "--out-dir", str(out)],
                               capture_output=True, text=True)
            self.assertNotEqual(r.returncode, 0, bad)
            self.assertIn("unsafe delete-file path", r.stdout, bad)

    def fake_node(self, out, code):
        d = self.root / "bin"
        d.mkdir(exist_ok=True)
        f = d / "node"
        f.write_text(f"#!/bin/sh\necho '{out}' >&2\nexit {code}\n")
        f.chmod(f.stat().st_mode | stat.S_IEXEC)
        return d

    def test_broken_node_is_not_a_syntax_error_but_real_syntax_errors_are(self):
        s = spec("@@ file behavior_pack/main.js", "@@ replace", "const b = 2;", "@@ with", "const b = 20;")
        old = os.environ["PATH"]
        try:
            os.environ["PATH"] = str(self.fake_node('CANNOT LINK EXECUTABLE "node": library not found', 127)) + os.pathsep + old
            notes, _ = self.run_spec(s)
            self.assertTrue(any("not usable" in n for n in notes))
            os.environ["PATH"] = str(self.fake_node("SyntaxError: Unexpected token", 1)) + os.pathsep + old
            with self.assertRaises(au.Fail) as cm:
                self.run_spec(spec("@@ file behavior_pack/main.js", "@@ replace", "const a = 1;", "@@ with", "const a = ;"))
            self.assertEqual(cm.exception.code, 4)
        finally:
            os.environ["PATH"] = old


if __name__ == "__main__":
    unittest.main()
