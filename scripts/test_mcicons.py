#!/usr/bin/env python3
"""MCicons: the release file stays one .tgz, the hash is checked, icons are read from it."""
import hashlib
import io
import os
import sys
import tarfile
import tempfile
import unittest
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parent / "lib"))
import sync_mcicons as sm  # noqa: E402
import mcicons  # noqa: E402


def make_tgz(path):
    png = io.BytesIO()
    Image.new("RGBA", (64, 64), (1, 2, 3, 255)).save(png, "PNG")
    with tarfile.open(path, "w:gz") as tf:
        for name, data in (("package/dist/icons/minecraft_bone.png", png.getvalue()),
                           ("package/dist/icons/minecraft_stick.png", png.getvalue()),
                           ("package/dist/css/icons/bone.css", b"x"), ("package/LICENSE", b"MIT")):
            i = tarfile.TarInfo(name)
            i.size = len(data)
            tf.addfile(i, io.BytesIO(data))
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


class McIcons(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        self.src = self.tmp / "src.tgz"
        self.sha = make_tgz(self.src)

    def test_sync_keeps_one_tgz_and_is_idempotent(self):
        dest = self.tmp / "ref"
        self.assertEqual(sm.sync(dest, self.src, expected_sha=self.sha, version="9.9.9"), "updated")
        self.assertEqual([p.name for p in dest.iterdir() if p.suffix == ".tgz"], ["mcicons-9.9.9.tgz"])
        self.assertEqual(sm.sync(dest, self.src, expected_sha=self.sha, version="9.9.9"), "unchanged")
        self.assertFalse((dest / "icons").exists(), "icons must not be unpacked into the repo")

    def test_old_versions_removed_and_bad_hash_rejected(self):
        dest = self.tmp / "ref"
        dest.mkdir()
        (dest / "mcicons-1.0.0.tgz").write_bytes(b"old")
        sm.sync(dest, self.src, expected_sha=self.sha, version="9.9.9")
        self.assertFalse((dest / "mcicons-1.0.0.tgz").exists())
        with self.assertRaises(ValueError):
            sm.sync(self.tmp / "other", self.src, expected_sha="0" * 64, version="9.9.9")

    def test_reads_icons_from_the_tgz(self):
        os.environ["MCICONS_TGZ"] = str(self.src)
        try:
            self.assertTrue(mcicons.has_icon("minecraft:bone"))
            self.assertTrue(mcicons.has_icon("bone"))
            self.assertEqual(mcicons.icon_image("minecraft:stick").size, (64, 64))
            self.assertIsNone(mcicons.icon_image("aln:custom_thing"))
            self.assertFalse(mcicons.has_icon("minecraft:missing"))
        finally:
            del os.environ["MCICONS_TGZ"]

    def test_pinned_release_constants(self):
        self.assertIn("/v" + sm.MCICONS_VERSION + "/mcicons-" + sm.MCICONS_VERSION + ".tgz", sm.MCICONS_URL)
        self.assertEqual(len(sm.MCICONS_SHA256), 64)


if __name__ == "__main__":
    unittest.main()
