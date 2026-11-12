#!/usr/bin/env python3
"""Build the CurseForge page for each pack from its DESCRIPTION.md.

DESCRIPTION.md stays the only source of truth. This script writes
description_views/<Name>.curseforge.html (paste it into the CurseForge project description).
Look: hero banner, feature cards, short lists, small compatibility table, collapsed permissions.
Only tags, CSS and classes that CurseForge supports are used (self-checked on every build).

Run: python3 scripts/build_description_views.py --all | --project MCPEDL/Addons/<Name> [--check] [--out DIR]
NEVER edit the generated files by hand.
"""
import argparse
import html
import re
import sys
from pathlib import Path

CF_URL = "https://www.curseforge.com/members/allenscreations/projects"
MP_URL = "https://mcpedl.com/user/alnstudios/"
ALLOWED_TAGS = set("p br strong b em i u strike ul li ol cite abbr acronym del ins blockquote span code pre sup dl dd dt "
                   "hr table tr td th tbody thead section article h1 h2 h3 h4 h5 h6 a img div".split())
ALLOWED_CSS = set("font-family font-weight font-style font-size color background-color text-align text-indent "
                  "text-decoration text-transform line-height padding-left margin-left margin-right border border-color "
                  "border-width border-radius width min-width align display float flex flex-wrap flex-direction "
                  "align-items gap aspect-ratio object-fit".split())
ALLOWED_CLASSES = {"spoiler"}
MAX_FONT = 40

CARD = ('<div style="flex:1;min-width:230px;background-color:#f3f6f9;color:#1f2933;border:1px solid #d5dde5;'
        'border-radius:8px;padding-left:14px">')
PERMISSIONS = (
    "<li>Rights: All rights reserved for ALNStudios.</li>"
    "<li>Content creators: You may feature this creation in videos and streams with credit to ALNStudios.</li>"
    "<li>Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link to this page.</li>"
    "<li>Unofficial community creation. Not an official Minecraft product and not approved by or associated with "
    "Mojang or Microsoft.</li>")
INSTALL = ("<li>Download the file from this page and open it with Minecraft.</li>"
           "<li>Create or edit a world and turn on the new pack(s) in its settings.</li>"
           "<li>Enable any Experimental toggles listed under Compatibility, then play.</li>")


def esc(t):
    return html.escape(t, quote=False)


def inline(t):
    """Markdown inline -> HTML. Keeps <img> tags, drops badges."""
    keep = []

    def stash(h):
        keep.append(h)
        return f"\x00{len(keep) - 1}\x00"

    t = re.sub(r"\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)", "", t)  # badge links
    t = re.sub(r"<img\b[^>]*>", lambda m: stash(re.sub(r"\s+(?!alt|src|width|height)[\w-]+=\"[^\"]*\"", "", m.group(0))), t)
    t = re.sub(r"!\[([^\]]*)\]\(([^)\s]+)\)", lambda m: stash(f'<img src="{m.group(2)}" alt="{esc(m.group(1))}">'), t)
    t = esc(t)
    t = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", lambda m: f'<a href="{m.group(2)}">{m.group(1)}</a>', t)
    t = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<!\*)\*([^*\n]+)\*(?!\*)", r"<em>\1</em>", t)
    t = re.sub(r"`([^`]+)`", r"<code>\1</code>", t)
    return re.sub(r"\x00(\d+)\x00", lambda m: keep[int(m.group(1))], t)


def sections(text):
    parts = re.split(r"(?m)^(?=## )", text.replace("\r\n", "\n"))
    return parts[0], {p.split("\n", 1)[0][3:].strip(): (p.split("\n", 1) + [""])[1] for p in parts[1:]}


def blocks_to_html(body):
    """Paragraphs, numbered and bullet lists, ### headings."""
    out, para, items, kind = [], [], [], None

    def flush():
        nonlocal para, items, kind
        if para:
            out.append("<p>" + inline(" ".join(para)) + "</p>")
        if items:
            out.append(f"<{kind}>" + "".join(f"<li>{inline(i)}</li>" for i in items) + f"</{kind}>")
        para, items, kind = [], [], None

    for line in body.strip("\n").split("\n"):
        s = line.strip()
        m_ol, m_ul = re.match(r"^\d+[.)]\s+(.*)", s), re.match(r"^[-*]\s+(.*)", s)
        if not s or s == "---":
            flush()
        elif s.startswith("### "):
            flush()
            out.append(f"<h3>{inline(s[4:])}</h3>")
        elif m_ol or m_ul:
            want = "ol" if m_ol else "ul"
            if kind != want:
                flush()
                kind = want
            items.append((m_ol or m_ul).group(1))
        elif s.startswith("<") and not s.startswith("<img"):
            continue
        else:
            if items:
                flush()
            para.append(s)
    flush()
    return "".join(out)


def cards(body):
    chunks = [c for c in re.split(r"(?m)^(?=### )", body.strip("\n")) if c.strip()]
    out = []
    for c in chunks:
        lines = c.strip("\n").split("\n")
        name = lines[0][4:].strip()
        what, extra = "", []
        for l in lines[1:]:
            m = re.match(r"^- \*\*([^*]+)\*\*: (.*)$", l.strip())
            if not m:
                continue
            if m.group(1) == "What Happens":
                what = m.group(2)
            else:
                extra.append(f"{m.group(1)}: {m.group(2)}")
        txt = f"<strong>{inline(name)}</strong>"
        if what:
            txt += "<br>" + inline(what)
        for e in extra:
            txt += "<br>" + inline(e)
        out.append(f"{CARD}<p>{txt}</p></div>")
    return '<div style="display:flex;flex-wrap:wrap;gap:12px">' + "".join(out) + "</div>"


def compat_table(body):
    rows = []
    for line in body.split("\n"):
        m = re.match(r"^- (Minecraft Bedrock Edition|Experimental features|Achievements): (.*)$", line.strip())
        if m:
            label = "Minecraft Bedrock" if m.group(1) == "Minecraft Bedrock Edition" else m.group(1)
            rows.append(f'<tr><th style="text-align:left">{label}</th><td>{inline(m.group(2))}</td></tr>')
    return '<table style="width:100%"><tbody>' + "".join(rows) + "</tbody></table>"


def pack_name(pre, fallback):
    """Name from the first '# ' title: any dash/colon subtitle and a trailing (vX.Y.Z) are dropped.
    No title at all -> the folder name."""
    head = re.search(r"(?m)^#\s+(.+?)\s*$", pre)
    if head:
        raw = re.sub(r"\s*\(v?\d+\.\d+\.\d+\)\s*$", "", head.group(1))
        name = re.split(r"\s+[\u2014\u2013-]+\s+|:\s+", raw, maxsplit=1)[0].strip()
        if name:
            return name
    return fallback.replace("-", " ").replace("_", " ").strip() or "Pack"


def render(md, fallback=""):
    pre, sec = sections(md)
    name = pack_name(pre, fallback)
    tagline = re.search(r"(?m)^\*\*(?!By )(.+)\*\*\s*$", pre)
    pitch = re.search(r"(?m)^>\s*(.+)$", pre)
    hero = ['<div style="background-color:#1b2430;color:#ffffff;text-align:center;border-radius:10px;line-height:1.5"><br>',
            f'<h1 style="color:#ffffff;font-size:36px;text-align:center">{esc(name)}</h1>']
    if tagline:
        hero.append(f'<p style="color:#9be28f;font-size:18px;text-align:center"><strong>{inline(tagline.group(1))}</strong></p>')
    if pitch:
        hero.append(f'<p style="color:#d5dbe3;text-align:center;margin-left:40px;margin-right:40px">{inline(pitch.group(1))}</p>')
    hero.append(f'<p style="text-align:center"><a style="color:#9be28f" href="{MP_URL}"><strong>Also on MCPEDL</strong></a>'
                f' &nbsp;|&nbsp; <a style="color:#9be28f" href="{CF_URL}"><strong>More by ALNStudios</strong></a></p><br></div>')
    h2 = '<h2 style="text-align:center">{}</h2>'
    parts = ["".join(hero)]
    if sec.get("Overview", "").strip():
        parts += [h2.format("About"), blocks_to_html(sec["Overview"])]
    if sec.get("Key Features", "").strip():
        parts += [h2.format("What You Get"), cards(sec["Key Features"])]
    if sec.get("How to Use", "").strip():
        parts += [h2.format("How to Play"), blocks_to_html(sec["How to Use"])]
    parts += [h2.format("Install"), f"<ol>{INSTALL}</ol>"]
    if sec.get("Compatibility", "").strip():
        parts += [h2.format("Compatibility"), compat_table(sec["Compatibility"])]
    parts.append("<hr>")
    parts.append('<p style="text-align:center;color:#6b7785;font-size:13px"><strong>By ALNStudios</strong> &nbsp;|&nbsp; '
                 f'<a style="color:#4a90d9" href="{CF_URL}">CurseForge</a> &nbsp;|&nbsp; <a style="color:#4a90d9" href="{MP_URL}">MCPEDL</a></p>')
    parts.append('<div class="spoiler"><p style="font-size:13px"><strong>Permissions and credits</strong></p>'
                 f'<ul style="font-size:13px">{PERMISSIONS}</ul></div>')
    kw = sec.get("Search & Discovery Keywords", "").replace("---", "").strip()
    if kw:
        parts.append(f'<p style="text-align:center;color:#8a95a1;font-size:12px">{esc(" ".join(kw.split()))}</p>')
    return "\n".join(parts) + "\n"


def check_html(h):
    errors = []
    for tag in sorted(set(re.findall(r"<([a-zA-Z][a-zA-Z0-9]*)", h)) - ALLOWED_TAGS):
        errors.append(f"tag not supported by CurseForge: <{tag}>")
    for style in re.findall(r'style="([^"]*)"', h):
        for prop in re.findall(r"([a-z-]+)\s*:", style):
            if prop not in ALLOWED_CSS:
                errors.append(f"CSS property not supported by CurseForge: {prop}")
        for px in re.findall(r"font-size:\s*(\d+)px", style):
            if int(px) > MAX_FONT:
                errors.append(f"font-size over {MAX_FONT}px")
    for cls in re.findall(r'class="([^"]*)"', h):
        for c in cls.split():
            if c not in ALLOWED_CLASSES:
                errors.append(f"class not supported by CurseForge: {c}")
    for href in re.findall(r'href="([^"]*)"', h):
        if not re.match(r"(https?://|mailto:)", href):
            errors.append(f"link must be http, https or mailto: {href}")
    return errors


def find_projects(root, project):
    if project:
        p = Path(project)
        return [p] if (p / "DESCRIPTION.md").is_file() else []
    return sorted(d.parent for d in root.glob("MCPEDL/*/*/DESCRIPTION.md"))


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--project", help="one pack folder, e.g. MCPEDL/Addons/Mining-Helmet")
    ap.add_argument("--all", action="store_true", help="every pack under MCPEDL/*/*")
    ap.add_argument("--check", action="store_true", help="only verify, write nothing; exit 1 if a view is missing or stale")
    ap.add_argument("--out", default="description_views", help="output folder (default: description_views)")
    ap.add_argument("--root", default=".", help="repo root")
    a = ap.parse_args(argv)
    if not a.project and not a.all:
        ap.error("use --all or --project <folder>")
    root = Path(a.root)
    out = root / a.out
    projects = find_projects(root, (root / a.project) if a.project else None)
    if not projects:
        print("No DESCRIPTION.md found.")
        return 1
    bad = 0
    for p in projects:
        try:
            h = render((p / "DESCRIPTION.md").read_text(encoding="utf-8"), p.name)
        except ValueError as e:
            print(f"FAIL {p.name}: {e}")
            bad += 1
            continue
        errs = check_html(h)
        for e in errs:
            print(f"FAIL {p.name}: {e}")
        bad += len(errs)
        target = out / f"{p.name}.curseforge.html"
        if a.check:
            if not target.is_file() or target.read_text(encoding="utf-8") != h:
                print(f"STALE {target}")
                bad += 1
        else:
            out.mkdir(parents=True, exist_ok=True)
            target.write_text(h, encoding="utf-8")
    print(f"{'Checked' if a.check else 'Built'} {len(projects)} description view(s), {bad} problem(s).")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
