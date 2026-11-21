#!/usr/bin/env python3
"""Create behavior_pack/scripts/lib/README.md for packs that have a main.js (the AI review notes of the pack's scripts).

  python3 scripts/make_lib_readmes.py [--pack MCPEDL/<Type>/<Name>] [--force] [--dry-run]

Default: every pack that has behavior_pack/scripts/main.js and no scripts/lib/README.md. An existing README is
kept unless --force. The text is EXTRACTED from the script files (files, line counts, header comment, imports,
subscribed events, namespaced ids, forms, dynamic properties, commands). Nothing is run or guessed; the
"Notes" section is left for a person or the AI review to complete. Nothing outside scripts/lib/README.md is written.
"""
import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATS = ("Addons", "Maps", "Script", "Minigame")
EVENT = re.compile(r"\b(world|system)\.(afterEvents|beforeEvents)\.(\w+)\.subscribe")
ID = re.compile(r"[\"']([a-z0-9_]+:[a-z0-9_./-]+)[\"']")
IMPORT = re.compile(r"""(?m)^\s*import\s+(?:[^'"]*?from\s+)?["']([^"']+)["']""")
EXPORT = re.compile(r"(?m)^\s*export\s+(?:default\s+)?(?:async\s+)?(?:function\*?|class|const|let|var)?\s*(\w+)")
SCRIPT_EVENT = re.compile(r"scriptEventReceive")
FORMS = ("ActionFormData", "ModalFormData", "MessageFormData")


def header_comment(text):
    for line in text.splitlines()[:25]:
        s = line.strip()
        if not s:
            continue
        s = re.sub(r"^(/\*\*?|\*+/?|//+)\s*", "", s).rstrip("*/ ").strip()
        if s and not s.lower().startswith(("import", "use strict")):
            return s[:140] if re.match(r"^(//|/\*|\*)", line.strip()) else ""
        if not re.match(r"^(//|/\*|\*)", line.strip()):
            return ""
    return ""


def pack_title(pack):
    d = pack / "DESCRIPTION.md"
    if d.is_file():
        for line in d.read_text(encoding="utf-8", errors="replace").splitlines():
            if line.startswith("# "):
                return re.split(r"\s[—–-]\s", line[2:].strip(), maxsplit=1)[0].strip()
    return pack.name.replace("-", " ")


def build(pack):
    sdir = pack / "behavior_pack" / "scripts"
    files = sorted(p for p in sdir.rglob("*.js") if "lib" not in p.relative_to(sdir).parts[:-1] or p.parent != sdir / "lib" or True)
    rows, imports, events, ids, feats = [], {}, set(), {}, set()
    script_events = False
    for f in files:
        text = f.read_text(encoding="utf-8", errors="replace")
        rel = f.relative_to(sdir).as_posix()
        rows.append((rel, text.count("\n") + 1, header_comment(text) or "(no header comment)"))
        for m in IMPORT.findall(text):
            imports.setdefault(m, set()).add(rel)
        for w, k, e in EVENT.findall(text):
            events.add(f"{w}.{k}.{e}")
        for i in ID.findall(text):
            ids.setdefault(i, set()).add(rel)
        script_events |= bool(SCRIPT_EVENT.search(text))
        for form in FORMS:
            if form in text:
                feats.add(form)
        if "setDynamicProperty" in text or "getDynamicProperty" in text:
            feats.add("dynamic properties (saved data)")
        if "runCommand" in text:
            feats.add("runCommand")
        if re.search(r"system\.runInterval\(", text):
            feats.add("repeating timer (system.runInterval)")
        if re.search(r"system\.runTimeout\(", text):
            feats.add("delayed task (system.runTimeout)")
    custom = {i: s for i, s in ids.items() if not i.startswith(("minecraft:", "http", "https"))}
    vanilla = sum(1 for i in ids if i.startswith("minecraft:"))
    out = [f"# {pack_title(pack)}: script notes (scripts/lib)\n",
           "For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.",
           "Extracted from the script files; nothing here was run in game.\n",
           "## Files\n", "| File | Lines | Purpose |", "| :-- | --: | :-- |"]
    out += [f"| `scripts/{r}` | {n} | {p.replace('|', '/')} |" for r, n, p in rows]
    out += ["", "## Imports\n"]
    mods = sorted(m for m in imports if m.startswith("@"))
    rels = sorted(m for m in imports if not m.startswith("@"))
    out += [f"- `{m}` (in {', '.join(f'`{x}`' for x in sorted(imports[m]))})" for m in mods + rels] or ["- none"]
    out += ["", "## Events\n"]
    out += [f"- `{e}`" for e in sorted(events)] or ["- no world/system event subscriptions found"]
    if script_events:
        out.append("- script events (`scriptEventReceive`) are handled")
    out += ["", "## Custom ids\n"]
    out += [f"- `{i}` ({', '.join(f'`{x}`' for x in sorted(s))})" for i, s in sorted(custom.items())] or ["- none found"]
    if vanilla:
        out.append(f"- plus {vanilla} vanilla `minecraft:` id(s)")
    out += ["", "## Features found\n"]
    out += [f"- {x}" for x in sorted(feats)] or ["- none of: forms, dynamic properties, runCommand, timers"]
    out += ["", "## Notes (AI review)\n",
            "Known limits, design decisions and things to check on the next update go here. Not filled in yet.", ""]
    return "\n".join(out)


def packs(only):
    if only:
        p = Path(only)
        yield p if p.is_absolute() else ROOT / p
        return
    for c in CATS:
        base = ROOT / "MCPEDL" / c
        for p in sorted(base.iterdir()) if base.is_dir() else []:
            if p.is_dir() and not p.name.startswith("."):
                yield p


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--pack", default="")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    made = 0
    for p in packs(a.pack):
        if not (p / "behavior_pack/scripts/main.js").is_file():
            continue
        dest = p / "behavior_pack/scripts/lib/README.md"
        if dest.exists() and not a.force:
            continue
        made += 1
        print(("would write " if a.dry_run else "wrote ") + dest.relative_to(ROOT).as_posix())
        if not a.dry_run:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_text(build(p), encoding="utf-8")
    print(f"{made} README(s) {'would be ' if a.dry_run else ''}written.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
