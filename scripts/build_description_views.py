#!/usr/bin/env python3
"""Build the CurseForge page for each pack from its DESCRIPTION.md.

DESCRIPTION.md stays the only source of truth. This script writes
description_views/<n>.curseforge.html (paste it into the CurseForge project description).

Look: dark "game store" page. Pack icon + title hero, latest-update box, feature cards with an accent top bar,
numbered step badges, collapsed Q&A spoilers, colored compatibility badges, and a Support section with the Ko-fi image.
Every pack gets its own accent color (stable, picked from the pack name; override in ACCENT_OVERRIDES).
Only tags, CSS and classes that CurseForge supports are used (self-checked on every build).

Run: python3 scripts/build_description_views.py --all | --project MCPEDL/Addons/<n> [--check] [--out DIR]
NEVER edit the generated files by hand.
"""
import argparse
import html
import re
import sys
import zlib
from pathlib import Path
from urllib.parse import quote

CF_URL = "https://www.curseforge.com/members/allenscreations/projects"
MP_URL = "https://mcpedl.com/user/alnstudios/"
KOFI_URL = "https://ko-fi.com/alnstudios"
RAW = "https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/"
KOFI_IMG = RAW + "assets/Images/ko-fi.png"

ALLOWED_TAGS = set("p br strong b em i u strike ul li ol cite abbr acronym del ins blockquote span code pre sup dl dd dt "
                   "hr table tr td th tbody thead section article h1 h2 h3 h4 h5 h6 a img div".split())
ALLOWED_ATTRS = set("style class href target src alt width height title data-title type cite".split())
ALLOWED_CSS = set("font-family font-weight font-style font-size color background-color text-align text-indent "
                  "text-decoration text-transform line-height padding-left margin-left margin-right border border-color "
                  "border-width border-radius width min-width align display float flex flex-wrap flex-direction "
                  "align-items gap aspect-ratio object-fit".split())
ALLOWED_CLASSES = {"spoiler"}
MAX_FONT = 40

# Dark store palette
BG, PANEL, LINE = "#12161c", "#1b222c", "#2a3441"
TEXT, MUTED, INK, LINK = "#dfe5ec", "#8b98a8", "#0b0f14", "#7cc4ff"
PALETTE = ["#4ade80", "#38bdf8", "#fbbf24", "#f472b6", "#a78bfa", "#fb923c", "#2dd4bf", "#f87171", "#a3e635", "#60a5fa"]
ACCENT_OVERRIDES = {}  # e.g. {"Mining-Helmet": "#fbbf24"}  (folder name -> color)

PERMISSIONS = (
    "<li>Rights: All rights reserved for ALNStudios.</li>"
    "<li>Content creators: You may feature this creation in videos and streams with credit to ALNStudios.</li>"
    "<li>Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link to this page.</li>"
    "<li>Unofficial community creation. Not an official Minecraft product and not approved by or associated with "
    "Mojang or Microsoft.</li>")
INSTALL = ("Download the file from this page and open it with Minecraft.",
           "Create or edit a world and turn on the new pack(s) in its settings.",
           "Enable any Experimental toggles listed under Compatibility, then play.")


def esc(t):
    return html.escape(t, quote=False)


def accent_for(folder):
    return ACCENT_OVERRIDES.get(folder) or PALETTE[zlib.crc32(folder.encode("utf-8")) % len(PALETTE)]


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
    t = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", lambda m: f'<a style="color:{LINK}" href="{m.group(2)}">{m.group(1)}</a>', t)
    t = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<!\*)\*([^*\n]+)\*(?!\*)", r"<em>\1</em>", t)
    t = re.sub(r"`([^`]+)`", r"<code>\1</code>", t)
    return re.sub(r"\x00(\d+)\x00", lambda m: keep[int(m.group(1))], t)


def sections(text):
    parts = re.split(r"(?m)^(?=## )", text.replace("\r\n", "\n"))
    return parts[0], {p.split("\n", 1)[0][3:].strip(): (p.split("\n", 1) + [""])[1] for p in parts[1:]}


def h2(title, acc):
    return f'<h2 style="color:#ffffff;text-align:left"><span style="color:{acc}">&#9670;</span> {title}</h2>'


def bar(acc):
    """Slim accent bar (4px tall) used as the 'top border' of cards."""
    return f'<div style="background-color:{acc};font-size:4px;line-height:4px;border-radius:10px">&nbsp;</div>'


def panel(inner, acc):
    return (f'<div style="background-color:{PANEL};border:1px solid {LINE};border-radius:10px">{bar(acc)}'
            f'<div style="padding-left:16px;margin-right:16px">{inner}</div></div>')


def steps(items, acc):
    """Numbered badge rows (1, 2, 3...)."""
    rows = "".join(
        f'<tr><td style="width:56px;text-align:center"><div style="background-color:{acc};color:{INK};font-weight:bold;'
        f'font-size:18px;text-align:center;border-radius:50%;width:36px;aspect-ratio:1/1;line-height:36px">{i}</div></td>'
        f'<td style="text-align:left;color:{TEXT}">{inline(t)}</td></tr>'
        for i, t in enumerate(items, 1))
    return f'<table style="width:100%;border-width:0"><tbody>{rows}</tbody></table>'


def blocks_to_html(body, acc, badges=False):
    """Paragraphs, numbered and bullet lists, ### headings. Numbered lists become step badges when badges=True."""
    out, para, items, kind = [], [], [], None

    def flush():
        nonlocal para, items, kind
        if para:
            out.append(f'<p style="color:{TEXT}">' + inline(" ".join(para)) + "</p>")
        if items:
            if kind == "ol" and badges:
                out.append(steps(items, acc))
            else:
                out.append(f'<{kind} style="color:{TEXT}">' + "".join(f"<li>{inline(i)}</li>" for i in items) + f"</{kind}>")
        para, items, kind = [], [], None

    for line in body.strip("\n").split("\n"):
        s = line.strip()
        m_ol, m_ul = re.match(r"^\d+[.)]\s+(.*)", s), re.match(r"^[-*]\s+(.*)", s)
        if not s or s == "---":
            flush()
        elif s.startswith("### "):
            flush()
            out.append(f'<h3 style="color:#ffffff">{inline(s[4:])}</h3>')
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


def cards(body, acc):
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
                extra.append((m.group(1), m.group(2)))
        txt = f'<strong style="color:#ffffff;font-size:17px">{inline(name)}</strong>'
        if what:
            txt += f'<br><span style="color:{TEXT}">{inline(what)}</span>'
        for label, e in extra:
            txt += (f'<br><span style="font-size:13px;color:{MUTED}">'
                    f"<strong>{inline(label)}:</strong> {inline(e)}</span>")
        out.append(f'<div style="flex:1;min-width:230px;background-color:{PANEL};border:1px solid {LINE};border-radius:10px">'
                   f'{bar(acc)}<div style="padding-left:14px;margin-right:14px"><p>{txt}</p></div></div>')
    return '<div style="display:flex;flex-wrap:wrap;gap:12px">' + "".join(out) + "</div>"


def questions(body):
    """Collapsed Q&A: one spoiler per question (question stays visible as the spoiler title)."""
    out = []
    for line in body.split("\n"):
        m = re.match(r"^- \*\*([^*]+)\*\*:? (.*)$", line.strip())
        if m:
            q = m.group(1).rstrip(":").strip()
            out.append(f'<div class="spoiler" title="{html.escape(q)}" data-title="{html.escape(q)}">'
                       f'<p style="color:{TEXT}"><strong>{inline(q)}</strong><br>{inline(m.group(2))}</p></div>')
    return "".join(out)


def _badge(label, text, color):
    return (f'<span style="background-color:{color};color:#ffffff;border-radius:6px;font-weight:bold">'
            f'&nbsp; {label}: {inline(text.rstrip("."))} &nbsp;</span>')


def compat_badges(body):
    """Colored badge row: green = fine, amber = needs a toggle, gray = unknown, red = problem."""
    out = []
    for line in body.split("\n"):
        m = re.match(r"^- (Minecraft Bedrock Edition|Experimental features|Achievements): (.*)$", line.strip())
        if not m:
            continue
        key, val = m.group(1), m.group(2)
        if key == "Minecraft Bedrock Edition":
            out.append(_badge("Bedrock", val, "#1f8a4c"))
        elif key == "Experimental features":
            if re.search(r"not verified|unknown", val, re.I):
                color = "#5b6675"
            elif re.search(r"\b(no|none|not required|not needed)\b", val, re.I):
                color = "#1f8a4c"
            else:
                color = "#b7791f"
            out.append(_badge("Experimental", val, color))
        else:
            if re.search(r"\b(disabled?|disables|blocked|off)\b", val, re.I):
                color = "#b83a3a"
            elif re.search(r"friendly|compatible|enabled|keeps", val, re.I):
                color = "#1f8a4c"
            else:
                color = "#5b6675"
            out.append(_badge("Achievements", val, color))
    return f'<p style="line-height:2.4">{" ".join(out)}</p>'


def latest_update(changelog_text):
    """Newest '## [x.y.z] - date - title' entry of a pack CHANGELOG.md -> dict, or None."""
    m = re.search(r"(?m)^## \[?v?(\d+\.\d+\.\d+)\]?\s*-\s*(\d{4}-\d{2}-\d{2})(?:\s*-\s*(.+?))?\s*$", changelog_text)
    if not m:
        return None
    rest = changelog_text[m.end():]
    nxt = re.search(r"(?m)^## ", rest)
    block = rest[:nxt.start()] if nxt else rest
    bullets = [b.group(1) for b in re.finditer(r"(?m)^- (.+)$", block)][:3]
    return {"version": m.group(1), "date": m.group(2), "title": (m.group(3) or "").strip(), "bullets": bullets}


def latest_box(u, acc):
    head = f'<strong>LATEST UPDATE &nbsp;&middot;&nbsp; v{u["version"]} &nbsp;&middot;&nbsp; {u["date"]}</strong>'
    inner = f'<p style="color:{acc};font-size:13px">{head}</p>'
    if u["title"]:
        inner += f'<p style="color:#ffffff;font-size:17px"><strong>{inline(u["title"])}</strong></p>'
    if u["bullets"]:
        inner += f'<ul style="color:{TEXT}">' + "".join(f"<li>{inline(b)}</li>" for b in u["bullets"]) + "</ul>"
    inner += f'<p style="color:{MUTED};font-size:12px">Full history: see the Changelog tab.</p>'
    return panel(inner, acc)


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


def hero(name, tagline, pitch, icon_url, acc):
    title = f'<h1 style="color:#ffffff;font-size:34px;text-align:{{a}}">{esc(name)}</h1>'
    tag = (f'<p style="color:{acc};font-size:18px;text-align:{{a}}"><strong>{inline(tagline)}</strong></p>' if tagline else "")
    if icon_url:
        head = (f'<table style="width:100%;border-width:0"><tbody><tr>'
                f'<td style="width:130px;text-align:center"><img src="{icon_url}" alt="{esc(name)} icon" width="96" height="96"></td>'
                f'<td style="text-align:left">{title.format(a="left")}{tag.format(a="left")}</td></tr></tbody></table>')
    else:
        head = title.format(a="center") + tag.format(a="center")
    pitch_html = (f'<p style="color:#c5ced9;text-align:center;margin-left:30px;margin-right:30px">{inline(pitch)}</p>' if pitch else "")
    return (f'<div style="background-color:{PANEL};border:1px solid {acc};border-radius:12px;line-height:1.5"><br>'
            f'{head}{pitch_html}<br></div>')


def support(acc):
    frame = (f'<div style="background-color:{PANEL};border:1px solid {LINE};border-radius:12px;text-align:center"><br>'
             f'<a href="{KOFI_URL}"><img src="{KOFI_IMG}" alt="Support ALNStudios on Ko-fi" width="250"></a><br><br></div>')
    links = (f'<p style="text-align:center"><a style="color:{LINK}" href="{CF_URL}"><strong>CurseForge</strong></a>'
             f' &nbsp;|&nbsp; <a style="color:{LINK}" href="{MP_URL}"><strong>MCPEDL</strong></a>'
             f' &nbsp;|&nbsp; <a style="color:{LINK}" href="{KOFI_URL}"><strong>Ko-fi</strong></a></p>')
    return h2("Support", acc) + frame + links


def render(md, fallback="", icon_url=None, latest=None, accent=None):
    pre, sec = sections(md)
    name = pack_name(pre, fallback)
    acc = accent or accent_for(fallback or name)
    tagline = re.search(r"(?m)^\*\*(?!By )(.+)\*\*\s*$", pre)
    pitch = re.search(r"(?m)^>\s*(.+)$", pre)
    parts = [hero(name, tagline.group(1) if tagline else "", pitch.group(1) if pitch else "", icon_url, acc)]
    if latest:
        parts += ["<br>", latest_box(latest, acc)]
    if sec.get("Overview", "").strip():
        parts += [h2("About", acc), blocks_to_html(sec["Overview"], acc)]
    if sec.get("Key Features", "").strip():
        parts += [h2("What You Get", acc), cards(sec["Key Features"], acc)]
    if sec.get("How to Use", "").strip():
        parts += [h2("How to Play", acc), blocks_to_html(sec["How to Use"], acc, badges=True)]
    if sec.get("Common Questions", "").strip():
        parts += [h2("Common Questions", acc), questions(sec["Common Questions"])]
    parts += [h2("Install", acc), steps(INSTALL, acc)]
    if sec.get("Compatibility", "").strip():
        parts += [h2("Compatibility", acc), compat_badges(sec["Compatibility"])]
    parts.append(support(acc))
    parts.append("<hr>")
    parts.append(f'<p style="text-align:center;color:{MUTED};font-size:13px"><strong>By ALNStudios</strong></p>')
    parts.append(f'<div class="spoiler"><p style="font-size:13px"><strong>Permissions and credits</strong></p>'
                 f'<ul style="font-size:13px">{PERMISSIONS}</ul></div>')
    kw = sec.get("Search & Discovery Keywords", "").replace("---", "").strip()
    if kw:
        parts.append(f'<p style="text-align:center;color:{MUTED};font-size:12px">{esc(" ".join(kw.split()))}</p>')
    # one dark wrapper: left padding on the outer box, right gap on the inner box (padding-left is the only padding CurseForge keeps)
    return (f'<div style="background-color:{BG};color:{TEXT};border-radius:14px;padding-left:22px">'
            f'<div style="margin-right:22px"><br>' + "\n".join(parts) + "<br></div></div>\n")


def check_html(h):
    errors = []
    for tag in sorted(set(re.findall(r"<([a-zA-Z][a-zA-Z0-9]*)", h)) - ALLOWED_TAGS):
        errors.append(f"tag not supported by CurseForge: <{tag}>")
    for tag_text in re.findall(r"<[a-zA-Z][^>]*>", h):
        bare = re.sub(r'"[^"]*"', '""', tag_text)
        for attr in re.findall(r"\s([a-zA-Z][\w:-]*)=", bare):
            if attr not in ALLOWED_ATTRS:
                errors.append(f"attribute not supported by CurseForge: {attr}")
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
    for src in re.findall(r'src="([^"]*)"', h):
        if not src.startswith("https://"):
            errors.append(f"image must use an https URL: {src}")
    return sorted(set(errors))


def find_projects(root, project):
    if project:
        p = Path(project)
        return [p] if (p / "DESCRIPTION.md").is_file() else []
    return sorted(d.parent for d in root.glob("MCPEDL/*/*/DESCRIPTION.md"))


def find_icon_url(root, project):
    """Raw GitHub URL of the pack's pack_icon.png (resource pack first), or None."""
    icons = sorted(project.glob("**/pack_icon.png"),
                   key=lambda p: (not re.search(r"(?i)\b(rp|resource)", p.parent.name), str(p)))
    if not icons:
        return None
    return RAW + quote(icons[0].relative_to(root).as_posix())


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
            log = p / "CHANGELOG.md"
            latest = latest_update(log.read_text(encoding="utf-8")) if log.is_file() else None
            h = render((p / "DESCRIPTION.md").read_text(encoding="utf-8"), p.name, find_icon_url(root, p), latest)
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
