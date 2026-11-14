#!/usr/bin/env python3
"""Build the CurseForge page for each pack from its DESCRIPTION.md.

DESCRIPTION.md stays the only source of truth. This script writes
description_views/<n>.curseforge.html (paste it into the CurseForge project description).

Look: dark "game store" page. Pack icon + title hero with badges (lowest supported Minecraft version, Experimental: No,
achievements), feature cards with an accent top bar,
numbered step badges, collapsed Q&A spoilers, colored compatibility badges, and a Support section with the Ko-fi image.
Every pack gets its own accent color (stable, picked from the pack name; override in ACCENT_OVERRIDES).
Only tags, CSS and classes that CurseForge supports are used (self-checked on every build).

Images: drop files into <pack>/assets/snapshots (screenshots, GIFs), <pack>/assets/recipes (crafting diagrams) and
<pack>/assets/items (custom item sprites). The file name becomes the caption: "01-Cursor-Light_in_a_cave.gif" ->
"Cursor Light in a cave" (a leading number only sets the order). They appear on the page automatically.

Run: python3 scripts/build_description_views.py --init   (creates assets/snapshots in every pack)
     python3 scripts/build_description_views.py --all | --project MCPEDL/Addons/<n> [--check] [--out DIR]
NEVER edit the generated files by hand.
"""
import argparse
import hashlib
import html
import json
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

# Styles. "dark" = dark store page. "minimal" = no page background and no text colors, so it follows the reader's
# CurseForge theme (light or dark); accent color is only used as solid fills.
THEMES = {
    "dark": dict(BG="#12161c", PANEL="#1b222c", LINE="#2a3441", TEXT="#dfe5ec", HEAD="#ffffff", SUB="#c5ced9",
                 MUTED="#8b98a8", LINK="#7cc4ff", ACCTXT=True),
    "minimal": dict(BG="", PANEL="", LINE="#8a94a3", TEXT="", HEAD="", SUB="",
                    MUTED="#8a94a3", LINK="", ACCTXT=False),
}
STYLES = tuple(THEMES)
SUFFIX = {"dark": "", "minimal": ".minimal"}
BG = PANEL = LINE = TEXT = HEAD = SUB = MUTED = LINK = ""
ACCTXT = True
INK = "#0b0f14"


def set_style(name):
    global BG, PANEL, LINE, TEXT, HEAD, SUB, MUTED, LINK, ACCTXT
    t = THEMES[name]
    BG, PANEL, LINE, TEXT, HEAD, SUB, MUTED, LINK, ACCTXT = (
        t["BG"], t["PANEL"], t["LINE"], t["TEXT"], t["HEAD"], t["SUB"], t["MUTED"], t["LINK"], t["ACCTXT"])


def tidy(h):
    """Drop color declarations that a style leaves empty, so the reader's theme colors show through."""
    h = re.sub(r"(?<![-\w])(?:background-)?color:\s*(?=[;\"])", "", h)
    h = re.sub(r";{2,}", ";", h)
    h = h.replace('style=";', 'style="')
    return re.sub(r' style=""', "", h)


def acc_text(acc):
    """Accent as text color only on the dark style (bright accents are unreadable on a light page)."""
    return acc if ACCTXT else ""


set_style("dark")
PALETTE = ["#4ade80", "#38bdf8", "#fbbf24", "#f472b6", "#a78bfa", "#fb923c", "#2dd4bf", "#f87171", "#a3e635", "#60a5fa"]
ACCENT_OVERRIDES = {}  # e.g. {"Mining-Helmet": "#fbbf24"}  (folder name -> color)

PERMISSIONS = (
    "<li>Rights: All rights reserved for ALNStudios.</li>"
    "<li>Content creators: You may feature this creation in videos and streams with credit to ALNStudios.</li>"
    "<li>Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link to this page.</li>"
    "<li>Unofficial community creation. Not an official Minecraft product and not approved by or associated with "
    "Mojang or Microsoft.</li>")
BYLINE = "by ALNStudios"
INSTALL = ("Download the file from this page and open it with Minecraft.",
           "Create or edit a world and turn on the new pack(s) in its settings.",
           "Play. No Experimental toggles needed.")


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
    return f'<h2 style="color:{HEAD};text-align:left;font-size:22px">{title}</h2>'


def bar(acc):
    """Slim accent bar (4px tall) used as the 'top border' of cards."""
    return f'<div style="background-color:{acc};font-size:4px;line-height:4px;border-radius:10px">&nbsp;</div>'


def panel(inner, acc):
    return (f'<div style="background-color:{PANEL};border:1px solid {LINE};border-radius:10px">{bar(acc)}'
            f'<div style="padding-left:12px;margin-right:12px">{inner}</div></div>')


def steps(items, acc):
    """Numbered badge rows (1, 2, 3...)."""
    rows = "".join(
        f'<tr><td style="width:44px;text-align:center"><div style="background-color:{acc};color:{INK};font-weight:bold;'
        f'font-size:15px;text-align:center;border-radius:50%;width:30px;aspect-ratio:1/1;line-height:30px">{i}</div></td>'
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
            out.append(f'<h3 style="color:{HEAD}">{inline(s[4:])}</h3>')
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
        txt = f'<strong style="color:{HEAD};font-size:16px">{inline(name)}</strong>'
        if what:
            txt += f'<br><span style="color:{TEXT}">{inline(what)}</span>'
        for label, e in extra:
            txt += (f'<br><span style="font-size:13px;color:{MUTED}">'
                    f"<strong>{inline(label)}:</strong> {inline(e)}</span>")
        out.append(f'<div style="flex:1;min-width:180px;background-color:{PANEL};border:1px solid {LINE};border-radius:10px">'
                   f'{bar(acc)}<div style="padding-left:12px;margin-right:12px"><p>{txt}</p></div></div>')
    return '<div style="display:flex;flex-wrap:wrap;gap:10px">' + "".join(out) + "</div>"


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
    return (f'<div style="background-color:{color};color:#ffffff;border-radius:6px;font-weight:bold;font-size:14px;'
            f'line-height:2">&nbsp;&nbsp;{label}: {inline(text.rstrip("."))}&nbsp;&nbsp;</div>')


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
    return f'<div style="display:flex;flex-wrap:wrap;gap:8px">{"".join(out)}</div>'


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
    inner = f'<p style="color:{acc_text(acc)};font-size:13px">{head}</p>'
    if u["title"]:
        inner += f'<p style="color:{HEAD};font-size:16px"><strong>{inline(u["title"])}</strong></p>'
    if u["bullets"]:
        inner += f'<ul style="color:{TEXT}">' + "".join(f"<li>{inline(b)}</li>" for b in u["bullets"]) + "</ul>"
    inner += f'<p style="color:{MUTED};font-size:12px">Full history: see the Changelog tab.</p>'
    return panel(inner, acc)


def find_min_version(project):
    """Lowest header.min_engine_version of the pack's manifests as '1.26+' (stable API only), or ''."""
    lows = []
    for mf in project.glob("**/manifest.json"):
        try:
            v = json.loads(mf.read_text(encoding="utf-8"))["header"]["min_engine_version"]
        except (ValueError, KeyError, TypeError, OSError):
            continue
        if isinstance(v, list) and len(v) >= 2 and all(isinstance(x, int) for x in v[:2]):
            lows.append(tuple(v[:2]))
    return f"{min(lows)[0]}.{min(lows)[1]}+" if lows else ""


def hero_badges(min_version, compat_body):
    """Badge row inside the hero: lowest Minecraft version, Experimental always No (stable API), achievements."""
    out = []
    bedrock = min_version
    ach = ""
    for line in compat_body.split("\n"):
        m = re.match(r"^- (Minecraft Bedrock Edition|Achievements): (.*)$", line.strip())
        if m and m.group(1) == "Minecraft Bedrock Edition" and not bedrock:
            bedrock = m.group(2)
        elif m and m.group(1) == "Achievements":
            ach = m.group(2)
    if bedrock:
        out.append(_badge("Bedrock", bedrock, "#1f8a4c"))
    out.append(_badge("Experimental", "No", "#1f8a4c"))
    if ach:
        if re.search(r"\b(disabled?|disables|blocked|off)\b", ach, re.I):
            color = "#b83a3a"
        elif re.search(r"friendly|compatible|enabled|keeps", ach, re.I):
            color = "#1f8a4c"
        else:
            color = "#5b6675"
        out.append(_badge("Achievements", ach, color))
    return f'<div style="display:flex;flex-wrap:wrap;gap:8px;margin-left:14px;margin-right:14px">{"".join(out)}</div>'


COMMAND_LINE = re.compile(r"^-\s+(?:\*\*)?`?(/[^`*:]+?)`?(?:\*\*)?\s*(?::|\u2014|\u2013|->)\s*(.+)$")


def commands(body, acc):
    """Own display for pack commands: one row per '- `/command args`: what it does' line."""
    rows = []
    for line in body.split("\n"):
        m = COMMAND_LINE.match(line.strip())
        if m:
            rows.append(f'<tr><td style="width:42%;text-align:left"><code>{esc(m.group(1).strip())}</code></td>'
                        f'<td style="text-align:left;color:{TEXT}">{inline(m.group(2))}</td></tr>')
    if not rows:
        return ""
    note = f'<p style="color:{MUTED};font-size:12px">Commands need cheats enabled. Cheats turn off achievements in that world.</p>'
    return (f'<div style="background-color:{PANEL};border:1px solid {LINE};border-radius:10px">{bar("#fbbf24")}'
            f'<div style="padding-left:12px;margin-right:12px"><table style="width:100%;border-width:0"><tbody>'
            f'{"".join(rows)}</tbody></table>{note}</div></div>')


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


def hero(name, tagline, pitch, icon_url, acc, badges=""):
    title = f'<h1 style="color:{HEAD};font-size:28px;text-align:{{a}}">{esc(name)}</h1>'
    by = f'<p style="color:{MUTED};font-size:14px;text-align:{{a}}">{BYLINE}</p>'
    tag = (f'<p style="color:{acc_text(acc)};font-size:16px;text-align:{{a}}"><strong>{inline(tagline)}</strong></p>' if tagline else "")
    if icon_url:
        head = (f'<table style="width:100%;border-width:0"><tbody><tr>'
                f'<td style="width:90px;text-align:center"><img src="{icon_url}" alt="{esc(name)} icon" width="72" height="72"></td>'
                f'<td style="text-align:left">{title.format(a="left")}{by.format(a="left")}{tag.format(a="left")}</td></tr></tbody></table>')
    else:
        head = title.format(a="center") + by.format(a="center") + tag.format(a="center")
    pitch_html = (f'<p style="color:{SUB};text-align:center;margin-left:14px;margin-right:14px">{inline(pitch)}</p>' if pitch else "")
    return (f'<div style="background-color:{PANEL};border:1px solid {acc};border-radius:12px;line-height:1.5"><br>'
            f'{head}{pitch_html}<br>{badges}<br></div>')


def support(acc):
    frame = (f'<div style="background-color:{PANEL};border:1px solid {LINE};border-radius:12px;text-align:center"><br>'
             f'<a href="{KOFI_URL}"><img src="{KOFI_IMG}" alt="Support ALNStudios on Ko-fi" width="250"></a><br><br></div>')
    links = (f'<p style="text-align:center"><a style="color:{LINK}" href="{CF_URL}"><strong>CurseForge</strong></a>'
             f' &nbsp;|&nbsp; <a style="color:{LINK}" href="{MP_URL}"><strong>MCPEDL</strong></a>'
             f' &nbsp;|&nbsp; <a style="color:{LINK}" href="{KOFI_URL}"><strong>Ko-fi</strong></a></p>')
    return h2("Support", acc) + frame + links


IMG_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
MEDIA_KINDS = ("snapshots", "items", "recipes")


def caption_from(name):
    """'01-Cursor-Light_in_a_cave.gif' -> 'Cursor Light in a cave'."""
    stem = Path(name).stem
    stem = re.sub(r"^\d+[\s._-]+", "", stem)
    return " ".join(stem.replace("-", " ").replace("_", " ").split()) or Path(name).stem


def _natural(name):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", name)]


def find_media(root, project, md_text=""):
    """{'snapshots': [(url, caption)], 'items': [...], 'recipes': [...]}; files already used in DESCRIPTION.md are skipped."""
    out = {}
    for kind in MEDIA_KINDS:
        folder = project / "assets" / kind
        files = [f for f in folder.iterdir() if f.is_file() and f.suffix.lower() in IMG_EXT] if folder.is_dir() else []
        out[kind] = [(RAW + quote(f.relative_to(root).as_posix()), caption_from(f.name))
                     for f in sorted(files, key=lambda f: _natural(f.name)) if f.name not in md_text]
    return out


def gallery(kind, entries):
    """Responsive image grid. Each image links to the full-size file; the caption sits under it."""
    basis = {"snapshots": "1 1 300px", "recipes": "0 1 400px", "items": "0 1 120px"}[kind]
    width = {"snapshots": "100%", "recipes": "100%", "items": "64px"}[kind]
    cells = []
    for url, cap in entries:
        img = f'<img src="{url}" alt="{html.escape(cap)}" style="width:{width}">'
        cells.append(f'<div style="flex:{basis};background-color:{PANEL};border:1px solid {LINE};border-radius:10px;'
                     f'text-align:center"><p><a href="{url}">{img}</a></p>'
                     f'<p style="color:{MUTED};font-size:13px">{esc(cap)}</p></div>')
    return '<div style="display:flex;flex-wrap:wrap;gap:10px">' + "".join(cells) + "</div>"


def render(md, fallback="", icon_url=None, latest=None, accent=None, style="dark", media=None, min_version=""):
    """latest is accepted for old callers and ignored: the page has no changelog box."""
    set_style(style)
    pre, sec = sections(md)
    name = pack_name(pre, fallback)
    acc = accent or accent_for(fallback or name)
    tagline = re.search(r"(?m)^\*\*(?!By )(.+)\*\*\s*$", pre)
    pitch = re.search(r"(?m)^>\s*(.+)$", pre)
    parts = [hero(name, tagline.group(1) if tagline else "", pitch.group(1) if pitch else "", icon_url, acc,
                  hero_badges(min_version, sec.get("Compatibility", "")))]
    if sec.get("Overview", "").strip():
        parts += [h2("About", acc), blocks_to_html(sec["Overview"], acc)]
    media = media or {}
    if media.get("snapshots"):
        parts += [h2("Screenshots", acc), gallery("snapshots", media["snapshots"])]
    if sec.get("Key Features", "").strip():
        parts += [h2("What You Get", acc), cards(sec["Key Features"], acc)]
    if media.get("items"):
        parts += [h2("Custom Items", acc), gallery("items", media["items"])]
    if media.get("recipes"):
        parts += [h2("Crafting Recipes", acc), gallery("recipes", media["recipes"])]
    if sec.get("How to Use", "").strip():
        parts += [h2("Get Started", acc), blocks_to_html(sec["How to Use"], acc, badges=True)]
    cmd = commands(sec.get("Commands", ""), acc) if sec.get("Commands", "").strip() else ""
    if cmd:
        parts += [h2("Commands", acc), cmd]
    if sec.get("Common Questions", "").strip():
        parts += [h2("Common Questions", acc), questions(sec["Common Questions"])]
    parts += [h2("Install", acc), steps(INSTALL, acc)]
    parts.append(support(acc))
    parts.append("<hr>")
    parts.append(f'<p style="text-align:center;color:{MUTED};font-size:13px"><strong>By ALNStudios</strong></p>')
    parts.append(f'<div class="spoiler"><p style="font-size:13px"><strong>Permissions and credits</strong></p>'
                 f'<ul style="font-size:13px">{PERMISSIONS}</ul></div>')
    kw = sec.get("Search & Discovery Keywords", "").replace("---", "").strip()
    if kw:
        parts.append(f'<p style="text-align:center;color:{MUTED};font-size:12px">{esc(" ".join(kw.split()))}</p>')
    # one dark wrapper: left padding on the outer box, right gap on the inner box (padding-left is the only padding CurseForge keeps)
    body = "\n".join(parts)
    if BG:
        h = (f'<div style="background-color:{BG};color:{TEXT};border-radius:12px;padding-left:12px">'
             f'<div style="margin-right:12px"><br>{body}<br></div></div>\n')
    else:
        h = f"<div>{body}</div>\n"
    return tidy(h)


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


SCRIPT_SIG = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
MANIFEST = ".inputs.json"


def input_key(md, changelog, icon, media, style, min_version=""):
    raw = json.dumps([SCRIPT_SIG, md, changelog, icon, media, style, min_version], sort_keys=True, default=str)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--project", help="one pack folder, e.g. MCPEDL/Addons/Mining-Helmet")
    ap.add_argument("--all", action="store_true", help="every pack under MCPEDL/*/*")
    ap.add_argument("--init", action="store_true", help="create assets/snapshots (with .gitkeep) in every pack, then exit")
    ap.add_argument("--check", action="store_true", help="only verify, write nothing; exit 1 if a view is missing or stale")
    ap.add_argument("--changed", action="store_true", help="skip packs whose inputs did not change since their view was written")
    ap.add_argument("--style", choices=STYLES + ("all",), default="dark",
                    help="dark (default), minimal (follows the reader's theme), or all")
    ap.add_argument("--out", default="description_views", help="output folder (default: description_views)")
    ap.add_argument("--root", default=".", help="repo root")
    a = ap.parse_args(argv)
    if not a.project and not a.all and not a.init:
        ap.error("use --all, --project <folder> or --init")
    root = Path(a.root)
    out = root / a.out
    projects = find_projects(root, (root / a.project) if a.project else None)
    if not projects:
        print("No DESCRIPTION.md found.")
        return 1
    if a.init:
        for p in projects:
            d = p / "assets" / "snapshots"
            d.mkdir(parents=True, exist_ok=True)
            (d / ".gitkeep").touch()
        print(f"Created assets/snapshots in {len(projects)} pack(s). Drop images there; the file name becomes the caption.")
        return 0
    bad = 0
    skipped = 0
    manifest = out / MANIFEST
    seen = {}
    if manifest.is_file():
        try:
            seen = json.loads(manifest.read_text(encoding="utf-8"))
        except ValueError:
            seen = {}
    styles = STYLES if a.style == "all" else (a.style,)
    jobs = [(p, st) for p in projects for st in styles]
    for p, st in jobs:
        try:
            log = p / "CHANGELOG.md"
            latest = None
            md = (p / "DESCRIPTION.md").read_text(encoding="utf-8")
            icon = find_icon_url(root, p)
            media = find_media(root, p, md)
            minv = find_min_version(p)
            key = input_key(md, "", icon, media, st, minv)
            target = out / f"{p.name}.curseforge{SUFFIX[st]}.html"
            if a.changed and not a.check and target.is_file() and seen.get(target.name) == key:
                skipped += 1
                continue
            h = render(md, p.name, icon, latest, style=st, media=media, min_version=minv)
        except ValueError as e:
            print(f"FAIL {p.name}: {e}")
            bad += 1
            continue
        errs = check_html(h)
        for e in errs:
            print(f"FAIL {p.name}: {e}")
        bad += len(errs)
        target = out / f"{p.name}.curseforge{SUFFIX[st]}.html"
        if a.check:
            if not target.is_file() or target.read_text(encoding="utf-8") != h:
                print(f"STALE {target}")
                bad += 1
        else:
            out.mkdir(parents=True, exist_ok=True)
            target.write_text(h, encoding="utf-8")
            seen[target.name] = key
    if not a.check:
        out.mkdir(parents=True, exist_ok=True)
        data = json.dumps(seen, indent=1, sort_keys=True) + "\n"
        if not manifest.is_file() or manifest.read_text(encoding="utf-8") != data:
            manifest.write_text(data, encoding="utf-8")
    print(f"{'Checked' if a.check else 'Built'} {len(jobs) - skipped} description view(s), skipped {skipped} unchanged, {bad} problem(s).")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
