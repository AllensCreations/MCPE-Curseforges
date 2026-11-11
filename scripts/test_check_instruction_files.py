#!/usr/bin/env python3
"""Tests for scripts/check_instruction_files.py. Run: python3 scripts/test_check_instruction_files.py"""
import shutil
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import check_instruction_files as cif  # noqa: E402


def sandbox():
    tmp = Path(tempfile.mkdtemp())
    (tmp / "scripts").mkdir()
    for f in (ROOT / "scripts").glob("*.py"):
        shutil.copy(f, tmp / "scripts" / f.name)
    for n in cif.FILES:
        shutil.copy(ROOT / n, tmp / n)
    wf = tmp / ".github" / "workflows"
    wf.mkdir(parents=True)
    for f in (ROOT / ".github" / "workflows").glob("*.yml"):
        shutil.copy(f, wf / f.name)
    return tmp


def edit(tmp, name, fn):
    p = tmp / name
    p.write_text(fn(p.read_text(encoding="utf-8")), encoding="utf-8")


def has(errors, needle):
    return any(needle in e for e in errors)


def main():
    assert cif.check(ROOT) == [], cif.check(ROOT)
    tmp = sandbox()
    try:
        assert cif.check(tmp) == []
        edit(tmp, "INSTRUCTIONS.md", lambda t: t + "\n" + "filler line\n" * 6000)
        assert has(cif.check(tmp), "exceeds"), "size cap not enforced"
        shutil.copy(ROOT / "INSTRUCTIONS.md", tmp / "INSTRUCTIONS.md")
        edit(tmp, "INSTRUCTIONS.md", lambda t: t + "\nUse version 1.2.3.4 here.\n")
        assert has(cif.check(tmp), "four-part"), "four-part version not caught"
        shutil.copy(ROOT / "INSTRUCTIONS.md", tmp / "INSTRUCTIONS.md")
        edit(tmp, "INSTRUCTIONS.md", lambda t: t + "\nVersion format is X.Y.Z.A now.\n")
        assert has(cif.check(tmp), "X.Y.Z.A"), "X.Y.Z.A outside a prohibition not caught"
        shutil.copy(ROOT / "INSTRUCTIONS.md", tmp / "INSTRUCTIONS.md")
        edit(tmp, "INSTRUCTIONS.md", lambda t: t + "\nSee `scripts/no_such_script.py`.\n")
        assert has(cif.check(tmp), "missing file"), "missing script reference not caught"
        shutil.copy(ROOT / "INSTRUCTIONS.md", tmp / "INSTRUCTIONS.md")
        edit(tmp, "PACK_GENERATOR_INSTRUCTIONS.md", lambda t: t.replace("- **Direct download:**", "- **Download:**", 1))
        assert has(cif.check(tmp), "README template"), "README template drift not caught"
        shutil.copy(ROOT / "PACK_GENERATOR_INSTRUCTIONS.md", tmp / "PACK_GENERATOR_INSTRUCTIONS.md")
        edit(tmp, "PACK_GENERATOR_INSTRUCTIONS.md", lambda t: t.replace("## Reply format", "## x").replace("### 4.11 Reply format", "### 4.11 x"))
        assert has(cif.check(tmp), "required section"), "missing section not caught"
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    print("test_check_instruction_files: OK")


if __name__ == "__main__":
    main()
