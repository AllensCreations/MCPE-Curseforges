#!/usr/bin/env python3
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import fetch_curseforge_logo as f
from PIL import Image


def png():
    buf = io.BytesIO()
    Image.new("RGB", (40, 20), "red").save(buf, "PNG")
    return buf.getvalue()


def fake(url_value):
    def get(url, headers=None):
        if url.startswith("https://api.curseforge.com"):
            return json.dumps({"data": {"logo": {"url": url_value}}}).encode()
        return png()
    return get


class LogoTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        for p in ("behavior_pack", "resource_pack"):
            (self.root / p).mkdir()

    def tearDown(self):
        self.tmp.cleanup()

    def test_creates_missing_icons(self):
        n = f.apply_logo(self.root, "1", "k", fake("https://media.forgecdn.net/a.png"))
        self.assertEqual(n, 2)
        with Image.open(self.root / "resource_pack" / "pack_icon.png") as im:
            self.assertEqual(im.size, (256, 256))

    def test_existing_icon_is_kept(self):
        Image.new("RGB", (256, 256), "blue").save(self.root / "behavior_pack" / "pack_icon.png")
        before = (self.root / "behavior_pack" / "pack_icon.png").read_bytes()
        self.assertEqual(f.apply_logo(self.root, "1", "k", fake("https://media.forgecdn.net/a.png")), 1)
        self.assertEqual((self.root / "behavior_pack" / "pack_icon.png").read_bytes(), before)

    def test_all_present_makes_no_request(self):
        for p in ("behavior_pack", "resource_pack"):
            Image.new("RGB", (256, 256)).save(self.root / p / "pack_icon.png")
        def boom(*a, **k):
            raise AssertionError("network used")
        self.assertEqual(f.apply_logo(self.root, "1", "k", boom), 0)

    def test_rejects_foreign_host(self):
        self.assertEqual(f.apply_logo(self.root, "1", "k", fake("https://evil.example/a.png")), 0)
        self.assertFalse((self.root / "resource_pack" / "pack_icon.png").exists())


if __name__ == "__main__":
    unittest.main()
