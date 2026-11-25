#!/usr/bin/env python3
"""Renderer library: the CurseForge description HTML built from a pack's DESCRIPTION.md.

It writes no files. scripts/build_listing_kits.py calls it and puts the HTML into Package/<n>.listing.md
(the only generated listing file; the separate .curseforge.html views were removed).
DESCRIPTION.md stays the only source of truth.

Look: "minimal" page (no page background, no text colors, so it follows the reader's light or dark theme). Logo-free hero (rounded frame, title, tagline pill) with badges (lowest supported Minecraft version, Experimental: No,
achievements), feature cards with a green title header,
rounded numbered step badges, green heading chips, collapsed Q&A spoilers, colored compatibility badges, and a Support section with the Ko-fi image.
Every pack uses the same dark green accent (ACCENT; per-pack override in ACCENT_OVERRIDES).
Only tags, CSS and classes that CurseForge supports are used (self-checked on every build).

Images: drop files into <pack>/assets/snapshots (screenshots, GIFs), <pack>/assets/recipes (crafting diagrams) and
<pack>/assets/items (custom item sprites). The file name becomes the caption: "01-Cursor-Light_in_a_cave.gif" ->
"Cursor Light in a cave" (a leading number only sets the order). They appear on the page automatically.

Run: python3 scripts/build_listing_kits.py --all | --project MCPEDL/Addons/<n> [--check]
"""
import hashlib
import html
import json
import re
from pathlib import Path
from urllib.parse import quote

CF_URL = "https://www.curseforge.com/members/allenscreations/projects"
MP_URL = "https://mcpedl.com/user/alnstudios/"
KOFI_URL = "https://ko-fi.com/alnstudios"
RAW = "https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/"
LABELS_DIR = Path(__file__).resolve().parent.parent.parent / "assets" / "labels"
KOFI_IMG = RAW + "assets/Images/ko-fi.png"

ALLOWED_TAGS = set("p br strong b em i u strike ul li ol cite abbr acronym del ins blockquote span code pre sup dl dd dt "
                   "hr table tr td th tbody thead section article h1 h2 h3 h4 h5 h6 a img div".split())
ALLOWED_ATTRS = set("style class href target src alt width height title data-title type cite".split())
ALLOWED_CSS = set("font-family font-weight font-style font-size color background-color text-align text-indent "
                  "text-decoration text-transform line-height padding-left margin-left margin-right margin border border-color "
                  "border-width border-radius width min-width max-width height align display float flex flex-wrap flex-direction "
                  "justify-content align-items gap aspect-ratio object-fit".split())
ALLOWED_CLASSES = {"spoiler"}
MAX_FONT = 40

# Styles. "dark" = dark store page. "minimal" = no page background and no text colors, so it follows the reader's
# CurseForge theme (light or dark); accent color is only used as solid fills.
THEMES = {
    "minimal": dict(BG="", PANEL="", LINE="#8a94a3", TEXT="", HEAD="", SUB="",
                    MUTED="#8a94a3", LINK="", ACCTXT=False, ACCENT="#15803d", SOFT="#dcfce7", DEEP="#14532d"),
    "dark": dict(BG="#12161c", PANEL="#1b222c", LINE="#2a3441", TEXT="#dfe5ec", HEAD="#ffffff", SUB="#c5ced9",
                 MUTED="#8b98a8", LINK="#7cc4ff", ACCTXT=True, ACCENT="#15803d", SOFT="#dcfce7", DEEP="#14532d"),
    "netherite": dict(BG="#0d1117", PANEL="#161b22", LINE="#30363d", TEXT="#c9d1d9", HEAD="#ffffff", SUB="#8b949e",
                      MUTED="#8b949e", LINK="#58a6ff", ACCTXT=True, ACCENT="#10b981", SOFT="#161b22", DEEP="#10b981"),
    "bedrock_gui": dict(BG="#313233", PANEL="#202021", LINE="#4a4b4d", TEXT="#e0e0e0", HEAD="#ffffff", SUB="#d0d0d0",
                        MUTED="#a0a0a0", LINK="#55ff55", ACCTXT=True, ACCENT="#4a4b4d", SOFT="#202021", DEEP="#ffffff"),
    "marketplace": dict(BG="#022c22", PANEL="#064e3b", LINE="#059669", TEXT="#ecfdf5", HEAD="#ffffff", SUB="#a7f3d0",
                        MUTED="#6ee7b7", LINK="#34d399", ACCTXT=True, ACCENT="#059669", SOFT="#047857", DEEP="#ffffff"),
    "arcane": dict(BG="#120c1f", PANEL="#1c1033", LINE="#581c87", TEXT="#f3e8ff", HEAD="#ffffff", SUB="#d8b4fe",
                   MUTED="#c084fc", LINK="#c084fc", ACCTXT=True, ACCENT="#7e22ce", SOFT="#3b0764", DEEP="#f3e8ff"),
}
STYLES = ("minimal",)  # the default published style: it follows the reader's theme (CurseForge and MCPEDL, light or dark)
SUFFIX = {k: f".{k}" if k != "minimal" else "" for k in THEMES}
BG = PANEL = LINE = TEXT = HEAD = SUB = MUTED = LINK = ""
ACCTXT = True
INK = "#ffffff"  # text on the dark green fills
SOFT = "#dcfce7"  # light green pill fill (badges); its text is DEEP
DEEP = "#14532d"
RADIUS = "16px"
ACCENT = "#15803d"  # default accent
CURRENT_ACCENT = ACCENT


def set_style(name):
    global BG, PANEL, LINE, TEXT, HEAD, SUB, MUTED, LINK, ACCTXT, CURRENT_ACCENT, SOFT, DEEP
    t = THEMES.get(name, THEMES["minimal"])
    BG, PANEL, LINE, TEXT, HEAD, SUB, MUTED, LINK, ACCTXT = (
        t["BG"], t["PANEL"], t["LINE"], t["TEXT"], t["HEAD"], t["SUB"], t["MUTED"], t["LINK"], t["ACCTXT"])
    CURRENT_ACCENT = t.get("ACCENT", ACCENT)
    SOFT = t.get("SOFT", "#dcfce7")
    DEEP = t.get("DEEP", "#14532d")


def tidy(h):
    """Drop color declarations that a style leaves empty, so the reader's theme colors show through."""
    h = re.sub(r"(?<![-\w])(?:background-)?color:\s*(?=[;\"])", "", h)
    h = re.sub(r";{2,}", ";", h)
    h = h.replace('style=";', 'style="')
    return re.sub(r' style=""', "", h)


def acc_text(acc):
    """Accent as text color only on the dark style (bright accents are unreadable on a light page)."""
    return acc if ACCTXT else ""


set_style("minimal")
ACCENT = "#15803d"  # dark green: the one accent color of every page
ACCENT_OVERRIDES = {}  # optional per-pack color, e.g. {"Mining-Helmet": "#b45309"}; empty = every pack uses ACCENT

PERMISSIONS = (
    "<li>Rights: All rights reserved for ALNStudios.</li>"
    "<li>Content creators: You may feature this creation in videos and streams with credit to ALNStudios.</li>"
    "<li>Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link to this page.</li>"
    "<li>Visual: Promotional/cover imagery used on this page is AI-generated to illustrate the concept and purpose of the pack.</li>"
    "<li>Unofficial community creation. Not an official Minecraft product and not approved by or associated with "
    "Mojang or Microsoft.</li>")
BYLINE = "by ALNStudios"
INSTALL = ("Download the file from this page and open it with Minecraft.",
           "Create or edit a world and turn on the new pack(s) in its settings.",
           "Play. No Experimental toggles needed.")


def esc(t):
    return html.escape(t, quote=False)


def accent_for(folder):
    return ACCENT_OVERRIDES.get(folder) or CURRENT_ACCENT


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


def _label_img_url(title: str) -> str | None:
    """Return a raw GitHub URL for the section label image if it exists, else None."""
    slug = re.sub(r"[^a-z0-9]+", "_", title.lower()).strip("_")
    f = LABELS_DIR / f"{slug}.png"
    if f.is_file():
        from urllib.parse import quote as _quote
        rel = f.relative_to(LABELS_DIR.parent.parent)
        return RAW + _quote(rel.as_posix())
    aliases = {
        "overview": "about",
        "get_started": "how_to_play",
        "how_to_use": "how_to_play",
        "installation": "install",
        "key_features": "features",
    }
    alias_slug = aliases.get(slug)
    if alias_slug:
        f = LABELS_DIR / f"{alias_slug}.png"
        if f.is_file():
            from urllib.parse import quote as _quote
            rel = f.relative_to(LABELS_DIR.parent.parent)
            return RAW + _quote(rel.as_posix())
    return None


def h2(title, acc):
    """Section heading: label image if available, else green rounded chip."""
    label_url = _label_img_url(title)
    if label_url:
        return f'<p><img src="{label_url}" alt="{esc(title)}"></p>'
    return (f'<h2 style="font-size:17px;text-align:left"><span style="background-color:{acc};color:{INK};border-radius:20px">'
            f'&nbsp;&nbsp;{title}&nbsp;&nbsp;</span></h2>')


def bar(acc):
    """Slim accent bar (4px tall) used as the 'top border' of cards."""
    return f'<div style="background-color:{acc};font-size:4px;line-height:4px;border-radius:10px">&nbsp;</div>'


def panel(inner, acc):
    return (f'<div style="background-color:{PANEL};border:1px solid {LINE};border-radius:10px">{bar(acc)}'
            f'<div style="padding-left:12px;margin-right:12px">{inner}</div></div>')


def steps(items, acc):
    """Numbered rounded-square badges (1, 2, 3...) inside one rounded panel."""
    rows = "".join(
        f'<tr><td style="width:44px;text-align:center"><div style="background-color:{acc};color:{INK};font-weight:bold;'
        f'font-size:15px;text-align:center;border-radius:10px;width:30px;aspect-ratio:1/1;line-height:30px">{i}</div></td>'
        f'<td style="text-align:left;color:{TEXT}">{inline(t)}</td></tr>'
        for i, t in enumerate(items, 1))
    return f'<table style="width:100%;border:1px solid {LINE};border-radius:{RADIUS}"><tbody>{rows}</tbody></table>'


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
    """Feature cards: a green title header with the description underneath."""
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
        txt = f'<span style="color:{TEXT}">{inline(what)}</span>' if what else ""
        for label, e in extra:
            txt += (f'<br><span style="font-size:13px;color:{MUTED}">'
                    f"<strong>{inline(label)}:</strong> {inline(e)}</span>")
        out.append(f'<div style="flex:1;min-width:200px;background-color:{PANEL};border:1px solid {LINE};border-radius:{RADIUS}">'
                   f'<div style="background-color:{acc};color:{INK};border-radius:{RADIUS};font-size:16px;line-height:2.2">'
                   f'<strong>&nbsp;&nbsp;{inline(name)}</strong></div>'
                   f'<div style="margin-left:12px;margin-right:12px"><p>{txt}</p></div></div>')
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


def _badge(label, text, color=None):
    """Light green pill with dark green text (readable on a light or a dark page)."""
    return (f'<div style="background-color:{SOFT};color:{DEEP};border-radius:20px;font-size:14px;line-height:2">'
            f'<strong>&nbsp;&nbsp;{label}</strong>: {inline(text.rstrip("."))}&nbsp;&nbsp;</div>')


def compat_badges(body):
    """Colored badge row: green = fine, amber = needs a toggle, gray = unknown, red = problem."""
    out = []
    for line in body.split("\n"):
        m = re.match(r"^- (Minecraft Bedrock Edition|Experimental features|Achievements): (.*)$", line.strip())
        if not m:
            continue
        key, val = m.group(1), m.group(2)
        if key == "Minecraft Bedrock Edition":
            out.append(_badge("Bedrock", val, ACCENT))
        elif key == "Experimental features":
            if re.search(r"not verified|unknown", val, re.I):
                color = ACCENT
            elif re.search(r"\b(no|none|not required|not needed)\b", val, re.I):
                color = ACCENT
            else:
                color = ACCENT
            out.append(_badge("Experimental", val, color))
        else:
            if re.search(r"\b(disabled?|disables|blocked|off)\b", val, re.I):
                color = ACCENT
            elif re.search(r"friendly|compatible|enabled|keeps", val, re.I):
                color = ACCENT
            else:
                color = ACCENT
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
        out.append(_badge("Bedrock", bedrock, ACCENT))
    out.append(_badge("Experimental", "No", ACCENT))
    if ach:
        if re.search(r"\b(disabled?|disables|blocked|off)\b", ach, re.I):
            color = ACCENT
        elif re.search(r"friendly|compatible|enabled|keeps", ach, re.I):
            color = ACCENT
        else:
            color = ACCENT
        out.append(_badge("Achievements", ach, color))
    return f'<div style="display:flex;flex-wrap:wrap;gap:8px;margin-left:14px;margin-right:14px">{"".join(out)}</div>'


COMMAND_TICKED = re.compile(r"^-\s+(?:\*\*)?`(/[^`]+)`(?:\*\*)?\s*(?::|\u2014|\u2013|->)\s*(.+)$")  # command in backticks may contain a colon (aln:item)
COMMAND_LINE = re.compile(r"^-\s+(?:\*\*)?`?(/[^`*:]+?)`?(?:\*\*)?\s*(?::|\u2014|\u2013|->)\s*(.+)$")


def commands(body, acc):
    """Own display for pack commands: one row per '- `/command args`: what it does' line."""
    rows = []
    for line in body.split("\n"):
        m = COMMAND_TICKED.match(line.strip()) or COMMAND_LINE.match(line.strip())
        if m:
            rows.append(f'<tr><td style="width:42%;text-align:left"><code>{esc(m.group(1).strip())}</code></td>'
                        f'<td style="text-align:left;color:{TEXT}">{inline(m.group(2))}</td></tr>')
    if not rows:
        return ""
    note = f'<p style="color:{MUTED};font-size:12px">Commands need cheats enabled. Cheats turn off achievements in that world.</p>'
    return (f'<div style="background-color:{PANEL};border:1px solid {LINE};border-radius:{RADIUS}">'
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


def hero(name, tagline, pitch, icon_url, acc, badges="", banner_url=None):
    """Rounded frame: title, byline, tagline in a green pill, pitch, badges. No logo (icon_url is accepted and ignored)."""
    pill = (f'<p style="text-align:center"><span style="background-color:{acc};color:{INK};border-radius:20px;font-size:16px">'
            f'&nbsp;&nbsp;<strong>{inline(tagline)}</strong>&nbsp;&nbsp;</span></p>' if tagline else "")
    pitch_html = (f'<p style="color:{SUB};text-align:center;margin-left:16px;margin-right:16px">{inline(pitch)}</p>' if pitch else "")
    if banner_url:
        title_block = f'<p style="text-align:center"><img src="{banner_url}" alt="{esc(name)}" style="width:100%"></p>'
    else:
        title_block = f'<h1 style="color:{HEAD};font-size:34px;text-align:center">{esc(name)}</h1>'
    return (f'<div style="background-color:{PANEL};border:2px solid {acc};border-radius:18px;line-height:1.5"><br>'
            f'{title_block}'
            f'<p style="color:{MUTED};font-size:14px;text-align:center">{BYLINE}</p>'
            f'{pill}{pitch_html}{badges}<br></div>')


def support(acc):
    frame = (f'<div style="background-color:{PANEL};border:1px solid {LINE};border-radius:{RADIUS};text-align:center"><br>'
             f'<a href="{KOFI_URL}"><img src="{KOFI_IMG}" alt="Support ALNStudios on Ko-fi" width="250"></a><br><br></div>')
    links = (f'<p style="text-align:center"><a style="color:{LINK}" href="{CF_URL}"><strong>CurseForge</strong></a>'
             f' &nbsp;|&nbsp; <a style="color:{LINK}" href="{MP_URL}"><strong>MCPEDL</strong></a>'
             f' &nbsp;|&nbsp; <a style="color:{LINK}" href="{KOFI_URL}"><strong>Ko-fi</strong></a></p>')
    return h2("Support", acc) + frame + links


def feedback_box(acc):
    """Prominent note encouraging players to comment bug reports, errors, and feature suggestions."""
    return (f'<div style="background-color:{PANEL};border:1px solid {LINE};border-radius:{RADIUS};text-align:center"><br>'
            f'<div style="background-color:{acc};color:{INK};border-radius:20px;font-size:15px;line-height:2;display:inline-block">'
            f'&nbsp;&nbsp;<strong>Found a Bug or Have a Suggestion?</strong>&nbsp;&nbsp;</div>'
            f'<p style="font-size:14px;color:{TEXT}">Please leave a comment on this project page! '
            f'All bug reports, gameplay feedback, and pack suggestions are welcome and appreciated.</p></div>')


def mechanics_spoilers(sec, acc):
    """Detailed gameplay mechanics, rosters, or stats placed inside collapsible spoilers."""
    standard_sections = {
        "overview", "key features", "how to use", "commands", "common questions",
        "compatibility", "compatibility and world settings", "compatibility and setup",
        "compatibility and limitations", "creator and permissions", "guidelines and attribution",
        "search & discovery keywords", "download", "installation", "pack information",
        "showcase", "preview", "previews", "crafting recipes", "recipes", "feedback and suggestions",
        "help and suggestions"
    }
    spoilers = []
    for sname, sbody in sec.items():
        slower = sname.lower().strip()
        if slower in standard_sections or re.match(r"(?i)(showcase|previews?)", slower):
            continue
        if not sbody.strip():
            continue
        content = blocks_to_html(sbody, acc)
        title_esc = html.escape(sname, quote=True)
        # CurseForge standard spoiler format: <h2>Title</h2><div class="spoiler">content</div>
        spoilers.append(
            f'{h2(inline(sname), acc)}\n'
            f'<div class="spoiler" title="{title_esc}" data-title="{title_esc}">\n'
            f'{content}</div>'
        )
    return spoilers


IMG_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
MEDIA_KINDS = ("snapshots", "items", "recipes")


def caption_from(name):
    """'01-Cursor-Light_in_a_cave.gif' -> 'Cursor Light in a cave'."""
    stem = Path(name).stem
    stem = re.sub(r"^\d+[\s._-]+", "", stem)
    stem = re.sub(r"^(?:aln|allenscreations|pnk)[:_\s-]+", "", stem, flags=re.IGNORECASE)
    words = stem.replace("-", " ").replace("_", " ").split()
    cap = " ".join(words) or Path(name).stem
    if cap and cap[0].islower():
        cap = cap[0].upper() + cap[1:]
    return cap


def _natural(name):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", name)]


def _item_display_names(project: Path) -> dict[str, str]:
    """Map custom item identifiers, short stems, and texture keys to their in-game display name."""
    names = {}
    lang = {}
    for sub in [project / "resource_pack", project / "behavior_pack", project]:
        texts = sub / "texts"
        if texts.is_dir():
            for lf in sorted(texts.glob("*.lang")):
                try:
                    for line in lf.read_text(encoding="utf-8", errors="replace").splitlines():
                        line = line.strip()
                        if line and not line.startswith("##") and "=" in line:
                            k, v = line.split("=", 1)
                            lang[k.strip()] = v.strip()
                except Exception:
                    pass

    # Read item_texture.json to map icon keys to texture names
    item_textures = {}
    for sub in [project / "resource_pack", project]:
        it_file = sub / "textures" / "item_texture.json"
        if it_file.is_file():
            try:
                it_data = json.loads(it_file.read_text(encoding="utf-8"))
                for tkey, tval in it_data.get("texture_data", {}).items():
                    tex = tval.get("textures", "")
                    if isinstance(tex, str):
                        item_textures[tkey] = Path(tex).stem
                    elif isinstance(tex, list) and tex:
                        item_textures[tkey] = Path(tex[0]).stem
            except Exception:
                pass

    for sub in [project / "behavior_pack", project / "resource_pack", project]:
        items_dir = sub / "items"
        if not items_dir.is_dir():
            continue
        for f in items_dir.rglob("*.json"):
            try:
                d = json.loads(f.read_text(encoding="utf-8"))
                item = d.get("minecraft:item", {})
                ident = item.get("description", {}).get("identifier", "")
                if not ident:
                    continue
                comps = item.get("components", {})
                dn = comps.get("minecraft:display_name")
                name = None
                if isinstance(dn, dict) and "value" in dn:
                    name = dn["value"]
                elif isinstance(dn, str):
                    name = dn

                short = ident.split(":")[-1]
                if name:
                    if name in lang:
                        name = lang[name]
                else:
                    for k in [f"item.{ident}.name", f"item.{ident}", f"item.{short}.name", f"item.{short}"]:
                        if k in lang:
                            name = lang[k]
                            break
                if not name and ident in lang:
                    name = lang[ident]

                if name:
                    name = re.sub(r"§[0-9a-fk-or]", "", name).strip()
                    lines = [l.strip() for l in name.replace("\\n", "\n").splitlines() if l.strip()]
                    if len(lines) > 1:
                        if lines[0].lower().startswith("music disc") and any("track" in l.lower() for l in lines[1:]):
                            track_line = next(l for l in lines[1:] if "track" in l.lower())
                            name = f"Music Disc ({track_line})"
                        else:
                            name = " - ".join(lines[:2])
                    elif lines:
                        name = lines[0]
                    else:
                        name = ""

                # Strip namespace prefix like "aln:", "aln_", "aln ", "allenscreations_", etc.
                if name:
                    name = re.sub(r"^(?:aln|allenscreations|pnk)[:_\s-]+", "", name, flags=re.IGNORECASE).strip()

                if not name:
                    name = short.replace("_", " ").replace("-", " ").title()

                keys = {ident, short, short.replace("_", "-"), short.replace("-", "_"),
                        ident.replace(":", "_"), ident.replace(":", "-")}

                icon = comps.get("minecraft:icon")
                icon_key = None
                if isinstance(icon, str):
                    icon_key = icon
                elif isinstance(icon, dict):
                    icon_key = icon.get("textures", {}).get("default") or icon.get("texture")
                if icon_key:
                    keys.add(icon_key)
                    keys.add(icon_key.split(":")[-1])
                    keys.add(re.sub(r"^(?:aln|allenscreations|pnk)[:_\s-]+", "", icon_key, flags=re.IGNORECASE))
                    if icon_key in item_textures:
                        keys.add(item_textures[icon_key])
                        keys.add(re.sub(r"^(?:aln|allenscreations|pnk)[:_\s-]+", "", item_textures[icon_key], flags=re.IGNORECASE))

                for k in keys:
                    names[k] = name
            except Exception:
                pass
    return names


def find_media(root, project, md_text=""):
    """{'snapshots': [(url, caption)], 'items': [...], 'recipes': [...]}; files already used in DESCRIPTION.md are skipped.
    Duplicate images (identical file content hash) are deduplicated so each asset is shown only once."""
    out = {}
    item_names = _item_display_names(project)
    for kind in MEDIA_KINDS:
        folder = project / "assets" / kind
        files = [f for f in folder.iterdir() if f.is_file() and f.suffix.lower() in IMG_EXT and not f.name.endswith("_label.png")] if folder.is_dir() else []
        seen_hashes = set()
        entries = []
        # If recipes contains animated GIFs for alternate outputs (e.g. foo_recipe.gif),
        # prefer the GIF over individual component PNGs (foo_recipe.png, foo_*_recipe.png)
        if kind == "recipes":
            gif_bases = {f.stem.replace("_recipe", "") for f in files if f.suffix.lower() == ".gif" and f.stem.endswith("_recipe")}
            filtered_files = []
            for f in files:
                if f.suffix.lower() == ".png" and f.stem.endswith("_recipe"):
                    stem_base = f.stem.replace("_recipe", "")
                    if any(stem_base == gb or stem_base.startswith(gb + "_") for gb in gif_bases):
                        continue
                filtered_files.append(f)
            files = filtered_files
        for f in sorted(files, key=lambda f: _natural(f.name)):
            if f.name in md_text:
                continue
            try:
                h = hashlib.sha256(f.read_bytes()).hexdigest()
                if h in seen_hashes:
                    continue
                seen_hashes.add(h)
            except OSError:
                pass
            if kind == "items":
                clean_stem = re.sub(r"^(?:aln|allenscreations|pnk)[:_\s-]+", "", f.stem, flags=re.IGNORECASE)
                if f.stem in item_names:
                    caption = item_names[f.stem]
                elif clean_stem in item_names:
                    caption = item_names[clean_stem]
                else:
                    caption = caption_from(f.name)
            elif kind == "recipes":
                base_stem = f.stem.replace("_recipe", "")
                clean_base = re.sub(r"^(?:aln|allenscreations|pnk)[:_\s-]+", "", base_stem, flags=re.IGNORECASE)
                if base_stem in item_names:
                    caption = item_names[base_stem]
                elif clean_base in item_names:
                    caption = item_names[clean_base]
                else:
                    caption = caption_from(base_stem)
            else:
                caption = caption_from(f.name)
            img_url = RAW + quote(f.relative_to(root).as_posix())
            entries.append((img_url, caption))
            label_file = f.with_name(f"{f.stem}_label.png")
            if label_file.is_file():
                if "labels" not in out:
                    out["labels"] = {}
                out["labels"][img_url] = RAW + quote(label_file.relative_to(root).as_posix())
        out[kind] = entries
    for b_name in ("banner.png", "Banner.png", "title_banner.png", "Title_banner.png"):
        banner_file = project / "assets" / b_name
        if banner_file.is_file():
            out["banner_url"] = RAW + quote(banner_file.relative_to(root).as_posix())
            break
    return out


def gallery(kind, entries, labels=None):
    """Responsive image grid. Static unlinked images to prevent navigating to source; snapshots omit text caption."""
    labels = labels or {}
    basis = {"snapshots": "1 1 300px", "recipes": "0 1 400px", "items": "0 1 120px"}[kind]
    img_style = {
        "snapshots": "width:100%;display:block",
        "recipes":   "width:400px;max-width:100%;height:222px;object-fit:contain;display:block;margin-left:auto;margin-right:auto",
        "items":     "width:64px;height:64px;object-fit:contain;display:inline-block;margin-left:auto;margin-right:auto",
    }[kind]
    cells = []
    for url, cap in entries:
        label_url = labels.get(url)
        alt_text = "" if kind == "snapshots" else html.escape(cap)
        img = f'<img src="{url}" alt="{alt_text}" style="{img_style}">'
        if label_url:
            caption_html = f'<p style="text-align:center"><img src="{label_url}" alt="{esc(cap)}" style="margin-left:auto;margin-right:auto;display:inline-block;max-width:100%"></p>'
        elif kind == "recipes":
            caption_html = (f'<p style="text-align:center"><span style="display:inline-block;background-color:#14101e;border:2px solid #3c2068;'
                            f'border-radius:6px;color:#ffffff;font-family:\'Minecraft\', \'Minecraftia\', \'Mojangles\', '
                            f'\'Press Start 2P\', monospace;font-size:13px;line-height:24px">'
                            f'&nbsp;&nbsp;{esc(cap)}&nbsp;&nbsp;</span></p>')
        elif kind == "snapshots":
            caption_html = ""
        else:
            caption_html = f'<p style="color:{MUTED};font-size:13px;text-align:center">{esc(cap)}</p>'
        cells.append(f'<div style="flex:{basis};background-color:{PANEL};border:1px solid {LINE};border-radius:{RADIUS};'
                     f'text-align:center"><p style="text-align:center">{img}</p>'
                     f'{caption_html}</div>')
    return f'<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center">{"".join(cells)}</div>'


def showcase(body):
    """'## Showcase / Previews': one card per '### Title' with its image(s) (GIFs included) and caption. Images are unlinked."""
    chunks = [c for c in re.split(r"(?m)^(?=### )", body.strip("\n")) if c.strip()]
    cells = []
    for c in chunks:
        lines = c.strip("\n").split("\n")
        title = lines[0][4:].strip() if lines[0].startswith("### ") else ""
        rest = "\n".join(lines[1:] if lines[0].startswith("### ") else lines)
        imgs = re.findall(r"!\[([^\]]*)\]\(([^)\s]+)\)", rest)
        text = re.sub(r"!\[[^\]]*\]\([^)\s]+\)", "", rest).strip().rstrip(":").strip()
        text = " ".join(text.split())
        shots = "".join(f'<p><img src="{u}" alt="{html.escape(a or title)}" style="width:100%"></p>' for a, u in imgs)
        head = f'<p><strong>{inline(title)}</strong></p>' if title else ""
        cap = f'<p style="color:{MUTED};font-size:13px">{inline(text)}</p>' if text else ""
        cells.append(f'<div style="flex:1 1 300px;background-color:{PANEL};border:1px solid {LINE};border-radius:{RADIUS};text-align:center">'
                     f'{head}{shots}{cap}</div>')
    return '<div style="display:flex;flex-wrap:wrap;gap:10px">' + "".join(cells) + "</div>" if cells else ""


LINK_SKIP = ("img.shields.io", "github.com/AllensCreations/MCPE-Curseforges)", "assets/Images/curseforge.jpg", "assets/Images/MCPEDL.jpg")


def lost_links(md, page):
    """URLs written in DESCRIPTION.md that are missing from the page (badges and the two profile banners are skipped on purpose)."""
    urls = re.findall(r"https?://[^\s)>\"'<]+", md)
    out = []
    for u in dict.fromkeys(urls):
        u = u.rstrip(".,;")
        if any(k.rstrip(")") in u for k in LINK_SKIP) or u.rstrip("/") == "https://github.com/AllensCreations/MCPE-Curseforges":
            continue
        if u not in page:
            out.append(u)
    return out


def render(md, fallback="", icon_url=None, latest=None, accent=None, style="minimal", media=None, min_version="", banner_url=None):
    """latest is accepted for old callers and ignored: the page has no changelog box."""
    set_style(style)
    pre, sec = sections(md)
    name = pack_name(pre, fallback)
    acc = accent or accent_for(fallback or name)
    tagline = re.search(r"(?m)^\*\*(?!By )(.+)\*\*\s*$", pre)
    pitch = re.search(r"(?m)^>\s*(.+)$", pre)
    media = media or {}
    banner = banner_url or media.get("banner_url")
    parts = [hero(name, tagline.group(1) if tagline else "", pitch.group(1) if pitch else "", icon_url, acc,
                  hero_badges(min_version, sec.get("Compatibility", "")), banner_url=banner)]
    if sec.get("Overview", "").strip():
        parts += [h2("About", acc), blocks_to_html(sec["Overview"], acc)]
    for sname, sbody in sec.items():
        if re.match(r"(?i)(showcase|previews?)", sname) and sbody.strip():
            sc = showcase(sbody)
            if sc:
                parts += [h2("Showcase", acc), sc]
    media = media or {}
    labels = media.get("labels", {})
    if media.get("snapshots"):
        parts += [h2("Screenshots", acc), gallery("snapshots", media["snapshots"], labels)]
    if sec.get("Key Features", "").strip():
        parts += [h2("What You Get", acc), cards(sec["Key Features"], acc)]
    mech = mechanics_spoilers(sec, acc)
    if mech:
        parts += mech
    if media.get("items"):
        parts += [h2("Custom Items", acc), gallery("items", media["items"], labels)]
    if media.get("recipes"):
        parts += [h2("Crafting Recipes", acc), gallery("recipes", media["recipes"], labels)]
    if sec.get("How to Use", "").strip():
        parts += [h2("Get Started", acc), blocks_to_html(sec["How to Use"], acc, badges=True)]
    cmd = commands(sec.get("Commands", ""), acc) if sec.get("Commands", "").strip() else ""
    if cmd:
        parts += [h2("Commands", acc), cmd]
    if sec.get("Common Questions", "").strip():
        parts += [h2("Common Questions", acc), questions(sec["Common Questions"])]
    parts += [h2("Install", acc), steps(INSTALL, acc)]
    parts.append(feedback_box(acc))
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
