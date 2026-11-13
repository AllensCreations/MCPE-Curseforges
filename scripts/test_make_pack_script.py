#!/usr/bin/env python3
"""Pack script: one .sh carries the project; the importer reads it; nothing else is written."""
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
REPO = SCRIPTS.parent
sys.path.insert(0, str(SCRIPTS))
import import_project_payload as ipp  # noqa: E402
import selftest_project_types as st  # noqa: E402


def run(root, *args):
    env = dict(os.environ, PYTHONDONTWRITEBYTECODE="1")
    r = subprocess.run([sys.executable, *args], cwd=root, capture_output=True, text=True, env=env)
    return r.returncode, r.stdout + r.stderr


class PackScriptTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        shutil.copytree(SCRIPTS, self.root / "scripts", ignore=shutil.ignore_patterns("__pycache__"))
        if (REPO / "assets").is_dir():
            shutil.copytree(REPO / "assets", self.root / "assets")
        st.sample(self.root, "addon", "Sample-Addon", with_rp=True)

    def tearDown(self):
        self.tmp.cleanup()

    def build(self):
        code, log = run(self.root, "scripts/make_pack_script.py", "build/Sample-Addon", "--rand", "abc12", "--out-dir", "out")
        self.assertEqual(code, 0, log)
        return self.root / "out" / "Sample-Addon_1.0.0_abc12.sh"

    def test_only_one_sh_is_written(self):
        sh = self.build()
        self.assertEqual([p.name for p in (self.root / "out").iterdir()], [sh.name])
        self.assertFalse(list(self.root.glob("*.b64")) + list(self.root.glob("*.zip")))
        self.assertEqual(subprocess.run(["bash", "-n", str(sh)]).returncode, 0)

    def test_importer_reads_the_sh_and_never_runs_it(self):
        sh = self.build()
        inc = self.root / "MCPEDL" / "incoming"
        inc.mkdir(parents=True)
        shutil.copy(sh, inc / sh.name)
        code, log = run(self.root, "scripts/import_project_payload.py", "--mode", "create", "--payload-file", sh.name)
        self.assertEqual(code, 0, log)
        self.assertTrue((self.root / "MCPEDL/Addons/Sample-Addon/project.json").is_file())

    def test_sh_without_payload_is_rejected(self):
        with self.assertRaises(SystemExit):
            ipp.payload_from_text("echo hi\n", "x.sh")
        self.assertEqual(ipp.payload_from_text("QUJD", "x.b64"), "QUJD")

    def test_bad_rand_is_refused(self):
        code, _ = run(self.root, "scripts/make_pack_script.py", "build/Sample-Addon", "--rand", "AB")
        self.assertNotEqual(code, 0)


if __name__ == "__main__":
    unittest.main()
