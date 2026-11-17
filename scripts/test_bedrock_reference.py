#!/usr/bin/env python3
import gzip
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_bedrock_reference as bbr  # noqa: E402


class StripJsoncTests(unittest.TestCase):
    def test_comments_and_trailing_commas_are_removed(self):
        text = '{\n  // line comment\n  "a": 1, /* block */\n  "b": [1, 2,],\n}'
        self.assertEqual(json.loads(bbr.strip_jsonc(text)), {"a": 1, "b": [1, 2]})

    def test_comment_markers_inside_strings_are_kept(self):
        text = '{"url": "https://example.com//x", "c": "/* not a comment */"}'
        self.assertEqual(json.loads(bbr.strip_jsonc(text)), json.loads(text))


class BuildTests(unittest.TestCase):
    def test_build_writes_one_json_and_is_idempotent(self):
        with tempfile.TemporaryDirectory() as tmp:
            src, out = Path(tmp) / "src", Path(tmp) / "out"
            (src / "behavior_pack" / "entities").mkdir(parents=True)
            (src / "resource_pack" / "texts").mkdir(parents=True)
            (src / "behavior_pack" / "manifest.json").write_text('{"header":{"min_engine_version":[1,26,60]}}')
            (src / "behavior_pack" / "entities" / "zombie.json").write_text('{"$schema":"x", // c\n "id": "zombie",}')
            (src / "behavior_pack" / "entities" / "broken.json").write_text("{not json")
            (src / "resource_pack" / "texts" / "en_US.lang").write_text("## c\nitem.a.name=Apple\t#note\n")
            argv = sys.argv
            try:
                sys.argv = ["x", "--src", str(src), "--out", str(out), "--sha", "abc123def456"]
                self.assertEqual(bbr.main(), 0)
                first_bytes = (out / "bedrock-samples.min.json.gz").read_bytes()
                first = gzip.decompress(first_bytes).decode("utf-8")
                self.assertEqual(bbr.main(), 0)
                self.assertEqual(first_bytes, (out / "bedrock-samples.min.json.gz").read_bytes())
            finally:
                sys.argv = argv
            doc = json.loads(first)
            self.assertEqual(doc["behavior_pack"]["entities"]["zombie"], {"id": "zombie"})
            self.assertEqual(doc["resource_pack"]["texts"]["en_US"], {"item.a.name": "Apple"})
            self.assertEqual(doc["_meta"]["min_engine_version"], [1, 26, 60])
            self.assertEqual(len(doc["_meta"]["unparsed"]), 1)
            self.assertTrue((out / "README.md").is_file())


if __name__ == "__main__":
    unittest.main()
