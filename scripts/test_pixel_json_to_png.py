#!/usr/bin/env python3
"""Tests for scripts/pixel_json_to_png.py (standard library only). Run: python3 scripts/test_pixel_json_to_png.py"""
import json
import struct
import sys
import tempfile
import unittest
import zlib
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import pixel_json_to_png as pj  # noqa: E402

PIE = {
    "name": "shepherds_pie", "size": 16,
    "palette": {"0": "#00000000", "1": "#3d2817", "2": "#6b472a", "3": "#8f5e38", "4": "#d6d6d6",
                "7": "#9c4a16", "8": "#d46c28", "9": "#e89358", "10": "#f5b88c"},
    "pixels": [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 4, 0, 4, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 4, 0, 4, 0, 4, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
        [0, 0, 1, 7, 8, 9, 10, 7, 8, 9, 10, 8, 7, 1, 0, 0],
        [0, 0, 1, 8, 9, 10, 7, 8, 9, 10, 7, 9, 8, 1, 0, 0],
        [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0],
        [0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 0, 0, 0],
        [0, 0, 0, 1, 3, 3, 3, 3, 3, 3, 3, 3, 1, 0, 0, 0],
        [0, 0, 0, 0, 1, 3, 3, 3, 3, 3, 3, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
}


def decode_png(data):
    """Minimal decoder for what encode_png writes (RGBA 8 bit, filter 0). -> (w, h, rows of (r,g,b,a))."""
    assert data[:8] == b"\x89PNG\r\n\x1a\n"
    pos, idat, w, h = 8, b"", 0, 0
    while pos < len(data):
        (length,) = struct.unpack(">I", data[pos:pos + 4])
        tag, body = data[pos + 4:pos + 8], data[pos + 8:pos + 8 + length]
        assert struct.unpack(">I", data[pos + 8 + length:pos + 12 + length])[0] == zlib.crc32(tag + body) & 0xFFFFFFFF
        if tag == b"IHDR":
            w, h, depth, ctype = struct.unpack(">IIBB", body[:10])
            assert (depth, ctype) == (8, 6)
        elif tag == b"IDAT":
            idat += body
        pos += 12 + length
    raw = zlib.decompress(idat)
    stride = w * 4 + 1
    rows = []
    for y in range(h):
        line = raw[y * stride:(y + 1) * stride]
        assert line[0] == 0
        rows.append([tuple(line[1 + x * 4:5 + x * 4]) for x in range(w)])
    return w, h, rows


def write(path, doc):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(doc), encoding="utf-8")


class Base(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.proj = Path(self.tmp.name) / "Pack"
        self.proj.mkdir()
        self.logs = []

    def tearDown(self):
        self.tmp.cleanup()

    def run_it(self, **kw):
        return pj.run(self.proj, log=self.logs.append, **kw)

    def tex(self, **over):
        t = json.loads(json.dumps(PIE))
        t.update(over)
        return t


class ConvertTests(Base):
    def test_your_sample_becomes_an_exact_png(self):
        write(self.proj / "texture_sources" / "food.json", [PIE])
        self.assertEqual(self.run_it(), 0)
        out = self.proj / "resource_pack" / "textures" / "items" / "shepherds_pie.png"
        w, h, rows = decode_png(out.read_bytes())
        self.assertEqual((w, h), (16, 16))
        self.assertEqual(rows[0][0], (0, 0, 0, 0))              # palette 0 = transparent
        self.assertEqual(rows[3][6], (0xd6, 0xd6, 0xd6, 255))   # steam
        self.assertEqual(rows[7][3], (0x3d, 0x28, 0x17, 255))   # outline
        self.assertEqual(rows[8][6], (0xf5, 0xb8, 0x8c, 255))   # palette index 10 (two digits)
        self.assertIn("PIXEL TEXTURES OK: 1 PNG(s)", self.logs[-1])

    def test_same_json_gives_same_bytes(self):
        write(self.proj / "texture_sources" / "a.json", [PIE])
        self.run_it()
        out = self.proj / "resource_pack" / "textures" / "items" / "shepherds_pie.png"
        first = out.read_bytes()
        out.unlink()
        self.run_it()
        self.assertEqual(out.read_bytes(), first)

    def test_accepted_json_shapes_and_folders(self):
        write(self.proj / "texture_sources" / "one.json", self.tex(name="solo"))                                   # one object
        write(self.proj / "texture_sources" / "wrapped.json", {"textures": [self.tex(name="wrapped", folder="items/banquet")]})
        write(self.proj / "texture_sources" / "block.json", [self.tex(name="stone_thing", folder="blocks")])
        self.assertEqual(self.run_it(), 0)
        base = self.proj / "resource_pack" / "textures"
        for rel in ("items/solo.png", "items/banquet/wrapped.png", "blocks/stone_thing.png"):
            self.assertTrue((base / rel).is_file(), rel)

    def test_larger_sizes(self):
        t = self.tex(name="big", size=32, pixels=[[1] * 32 for _ in range(32)], palette={"1": "#ff0000"})
        write(self.proj / "texture_sources" / "big.json", [t])
        self.assertEqual(self.run_it(), 0)
        w, h, rows = decode_png((self.proj / "resource_pack/textures/items/big.png").read_bytes())
        self.assertEqual((w, h, rows[31][31]), (32, 32, (255, 0, 0, 255)))

    def test_alpha_and_six_digit_colors(self):
        t = self.tex(name="alpha", palette={"0": "#00000000", "1": "#11223380", "2": "#AABBCC"},
                     pixels=[[0] * 16 for _ in range(16)])
        t["pixels"][7] = [2] * 16
        t["pixels"][8] = [1] * 16
        write(self.proj / "texture_sources" / "a.json", [t])
        self.run_it()
        _, _, rows = decode_png((self.proj / "resource_pack/textures/items/alpha.png").read_bytes())
        self.assertEqual(rows[7][0], (0xAA, 0xBB, 0xCC, 255))
        self.assertEqual(rows[8][0], (0x11, 0x22, 0x33, 0x80))

    def test_check_writes_nothing_and_preview_goes_outside_the_project(self):
        write(self.proj / "texture_sources" / "a.json", [PIE])
        self.assertEqual(self.run_it(check=True), 0)
        self.assertFalse((self.proj / "resource_pack").exists())
        sheet = Path(self.tmp.name) / "review" / "sheet.png"
        self.assertEqual(self.run_it(preview=sheet), 0)
        w, h, _ = decode_png(sheet.read_bytes())
        self.assertEqual((w, h), (12 + 140, 12 + 140))
        self.assertEqual(sorted(p.name for p in (self.proj / "texture_sources").iterdir()), ["a.json"])


class ValidationTests(Base):
    def test_all_problems_reported_together_and_nothing_written(self):
        bad_size = self.tex(name="bad_size", size=15)
        bad_color = self.tex(name="bad_color"); bad_color["palette"]["4"] = "red"
        bad_pixel = self.tex(name="bad_pixel"); bad_pixel["pixels"][5][5] = 99
        short_row = self.tex(name="short_row"); short_row["pixels"][2] = [0] * 15
        few_rows = self.tex(name="few_rows"); few_rows["pixels"] = few_rows["pixels"][:14]
        bad_name = self.tex(name="Bad Name")
        bad_folder = self.tex(name="bad_folder", folder="../escape")
        empty = self.tex(name="empty", palette={"0": "#00000000"}, pixels=[[0] * 16 for _ in range(16)])
        dup1, dup2 = self.tex(name="twin"), self.tex(name="twin")
        write(self.proj / "texture_sources" / "all.json", [bad_size, bad_color, bad_pixel, short_row, few_rows,
                                                           bad_name, bad_folder, empty, dup1, dup2, self.tex(name="fine")])
        self.assertEqual(self.run_it(), 1)
        text = "\n".join(self.logs)
        for needle in ("size must be", "not #RRGGBB", "not in the palette", "row 2 needs 16", "needs 16 rows, found 14",
                       "name must be lowercase", "folder must be", "every pixel is transparent", "duplicate of"):
            self.assertIn(needle, text)
        self.assertFalse((self.proj / "resource_pack").exists())  # even 'fine' is not written

    def test_unreadable_json_is_reported(self):
        (self.proj / "texture_sources").mkdir()
        (self.proj / "texture_sources" / "broken.json").write_text("[{oops", encoding="utf-8")
        self.assertEqual(self.run_it(), 1)
        self.assertIn("cannot read JSON", "\n".join(self.logs))

    def test_unused_palette_entries_are_only_a_note(self):
        t = self.tex(name="spare"); t["palette"]["5"] = "#ffffff"
        write(self.proj / "texture_sources" / "a.json", [t])
        self.assertEqual(self.run_it(), 0)
        self.assertTrue(any(l.startswith("note") and "[5]" in l for l in self.logs))

    def test_no_sources_is_not_an_error(self):
        self.assertEqual(self.run_it(), 0)
        self.assertIn("No pixel JSON found", self.logs[0])

    def test_booleans_are_not_numbers(self):
        t = self.tex(name="boolish"); t["pixels"][0][0] = True
        write(self.proj / "texture_sources" / "a.json", [t])
        self.assertEqual(self.run_it(), 1)


if __name__ == "__main__":
    unittest.main()
