#!/usr/bin/env python3
import os
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import step_summary as ss  # noqa: E402


class StepSummaryTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.summary = os.path.join(self.tmp.name, "summary.md")

    def tearDown(self):
        self.tmp.cleanup()

    def test_output_goes_into_the_summary_and_the_exit_code_is_kept(self):
        cmd = [sys.executable, "-c", "import sys; print('out'); print('err', file=sys.stderr); sys.exit(3)"]
        self.assertEqual(ss.run("My step", cmd, self.summary), 3)
        text = Path(self.summary).read_text(encoding="utf-8")
        self.assertTrue(text.startswith("### My step\n```\n"))
        self.assertIn("out", text)
        self.assertIn("err", text)
        self.assertTrue(text.endswith("```\n"))

    def test_summaries_are_appended(self):
        ok = [sys.executable, "-c", "print('a')"]
        ss.run("One", ok, self.summary)
        ss.run("Two", ok, self.summary)
        text = Path(self.summary).read_text(encoding="utf-8")
        self.assertIn("### One", text)
        self.assertIn("### Two", text)

    def test_missing_command_exits_127_and_no_summary_file_needed(self):
        self.assertEqual(ss.run("Gone", ["definitely-not-a-command-xyz"], self.summary), 127)
        self.assertEqual(ss.run("No file", [sys.executable, "-c", "pass"], None), 0)

    def test_usage_error(self):
        self.assertEqual(ss.main(["Title"]), 2)
        self.assertEqual(ss.main(["Title", "python3"]), 2)


if __name__ == "__main__":
    unittest.main()
