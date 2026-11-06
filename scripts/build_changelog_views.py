#!/usr/bin/env python3
"""Build folded changelog views from the plain CHANGELOG.md of each project.

  python3 scripts/build_changelog_views.py --all
  python3 scripts/build_changelog_views.py --project NAME [--open 1] [--stdout]

CHANGELOG.md stays plain text (the source of truth). Views go to changelog_views/:
  <Name>.github.md        newest release open, older ones folded by minor series (details/summary)
  <Name>.curseforge.html  same layout with CurseForge spoilers, paste into the project description
"""
import argparse, html, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "changelog_views"
CATEGORIES = ("Addons", "Maps", "Script", "Minigame")
TITLE = re.compile(r"^# Changelog — (.+)$")
ENTRY = re.compile(r"^## \[(\d+)\.(\d+)\.(\d+)(?:\.(\d+))?\] - (\d{4}-\d{2}-\d{2})$")
GROUP = re.compile(r"^### (.+)$")
BULLET = re.compile(r"^- \*\*([^*]+)\*\*: (\S.*)$")


def parse(text):
    name, releases, cur, grp = None, [], None, None
    for line in text.replace("\r\n", "\n").split("\n"):
        line = line.rstrip()
        m = TITLE.match(line)
        if m:
            name = m.group(1)
            continue
        e = ENTRY.match(line)
        if e:
            cur = {"v": tuple(int(x or 0) for x in e.groups()[:4]), "date": e.group(5), "groups": []}
            releases.append(cur)
            grp = None
            continue
        g = GROUP.match(line)
        if g and cur is not None:
            grp = {"title": g.group(1), "items": []}
            cur["groups"].append(grp)
            continue
        b = BULLET.match(line)
        if b and grp is not None:
            grp["items"].append((b.group(1), b.group(2)))
    releases.sort(key=lambda r: r["v"], reverse=True)
    return name, releases


def ver(r):
    return ".".join(map(str, r["v"] if r["v"][3] else r["v"][:3]))


def series(releases):
    order, groups = [], {}
    for r in releases:
        key = r["v"][:2]
        if key not in groups:
            groups[key] = []
            order.append(key)
        groups[key].append(r)
    return [(f"{k[0]}.{k[1]}.x", groups[k]) for k in order]


def release_md(r, level):
    out = [f"{'#' * level} [{ver(r)}] - {r['date']}", ""]
    for g in r["groups"]:
        out.append(f"{'#' * (level + 1)} {g['title']}")
        out.extend(f"- **{t}**: {x}" for t, x in g["items"])
        out.append("")
    return out


def build_github(name, releases, keep_open):
    out = [f"# Changelog — {name}", ""]
    for r in releases[:keep_open]:
        out += release_md(r, 2)
    for label, rs in series(releases[keep_open:]):
        count = f"{len(rs)} release" + ("s" if len(rs) != 1 else "")
        out += ["<details>", f"<summary><b>{label}</b> ({count})</summary>", ""]
        for r in rs:
            out += release_md(r, 3)
        out += ["</details>", ""]
    return "\n".join(out).rstrip() + "\n"


def release_html(r, level):
    out = [f"<h{level}>{ver(r)} - {r['date']}</h{level}>"]
    for g in r["groups"]:
        out.append(f"<h{level + 1}>{html.escape(g['title'])}</h{level + 1}>")
        items = "".join(f"<li><strong>{html.escape(t)}</strong>: {html.escape(x)}</li>" for t, x in g["items"])
        out.append(f"<ul>{items}</ul>")
    return "".join(out)


def build_curseforge(name, releases, keep_open):
    out = []
    for r in releases[:keep_open]:
        out.append(release_html(r, 2))
    for label, rs in series(releases[keep_open:]):
        count = f"{len(rs)} release" + ("s" if len(rs) != 1 else "")
        inner = "".join(release_html(r, 3) for r in rs)
        out.append(f'<h2>{label} ({count})</h2><div class="spoiler">{inner}</div>')
    return "\n".join(out) + "\n"


def find_projects():
    for cat in CATEGORIES:
        base = ROOT / "MCPEDL" / cat
        if base.is_dir():
            for p in sorted(x for x in base.iterdir() if x.is_dir()):
                yield p


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--project")
    ap.add_argument("--open", type=int, default=1, help="Newest releases left open (default 1).")
    ap.add_argument("--stdout", action="store_true", help="Print instead of writing files.")
    args = ap.parse_args()
    if not args.all and not args.project:
        print("Pass --all or --project NAME.", file=sys.stderr)
        return 2
    built = skipped = 0
    for p in find_projects():
        if not args.all and args.project not in (p.name, f"MCPEDL/{p.parent.name}/{p.name}"):
            continue
        f = p / "CHANGELOG.md"
        if not f.is_file():
            continue
        name, releases = parse(f.read_text(encoding="utf-8"))
        if not name or not releases:
            print(f"skipped {p.name}: not in the standard changelog format (run scripts/doc_template.py)")
            skipped += 1
            continue
        keep = max(1, args.open)
        gh, cf = build_github(name, releases, keep), build_curseforge(name, releases, keep)
        if args.stdout:
            print(gh)
            print("-" * 40)
            print(cf)
        else:
            OUT.mkdir(exist_ok=True)
            (OUT / f"{p.name}.github.md").write_text(gh, encoding="utf-8")
            (OUT / f"{p.name}.curseforge.html").write_text(cf, encoding="utf-8")
            print(f"built {p.name} ({len(releases)} releases)")
        built += 1
    print(f"[Changelog views] {built} built, {skipped} skipped.")
    return 0 if built else 1


if __name__ == "__main__":
    raise SystemExit(main())
