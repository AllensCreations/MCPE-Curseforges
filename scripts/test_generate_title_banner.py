#!/usr/bin/env python3
"""Tests for generate_title_banner.py."""
import tempfile
import unittest
from pathlib import Path

from PIL import Image

import generate_title_banner as gtb


class TitleBannerTests(unittest.TestCase):
    def test_render_banner_creates_valid_image(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            out_path = Path(tmpdir) / "banner.png"
            img = gtb.render_banner("Double Jump", "ADDON", out_path=out_path)
            self.assertTrue(out_path.is_file())
            self.assertIsInstance(img, Image.Image)
            self.assertEqual(img.mode, "RGBA")
            self.assertGreater(img.width, 100)
            self.assertGreater(img.height, 30)

    def test_custom_subtitle(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            out_path = Path(tmpdir) / "custom.png"
            img = gtb.render_banner("Mining Helmet", "BEDROCK ADDON", out_path=out_path)
            self.assertTrue(out_path.is_file())
            self.assertEqual(img.mode, "RGBA")

    def test_extract_pack_name(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            p = Path(tmpdir)
            (p / "DESCRIPTION.md").write_text("# Test Pack — Exciting Add-on\n\nSome text\n", encoding="utf-8")
            name = gtb.extract_pack_name(p)
            self.assertEqual(name, "Test Pack")

    def test_long_title_wraps_lines(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            out_path = Path(tmpdir) / "long.png"
            img = gtb.render_banner("Super Ultra Incredible Extraordinary Adventure Pack For Minecraft Bedrock", "ADDON", out_path=out_path)
            self.assertTrue(out_path.is_file())
            self.assertIsInstance(img, Image.Image)
            # Banner height with multiple lines should be noticeably larger than single line
            single = gtb.render_banner("Short Title", "ADDON")
            self.assertGreater(img.height, single.height)


if __name__ == "__main__":
    unittest.main()
