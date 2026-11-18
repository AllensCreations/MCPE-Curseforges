#!/usr/bin/env python3
"""Build the AI review export of the given paths (index, AI instructions, every text file).

Moved out of .github/workflows/collect-ai-review-files.yml so the same code serves the manual run and the
automatic per-package run (scripts/auto_ai_review.py).
  PATHS=<comma/newline separated paths>   (NEW = new-pack kit)
  AI_OUT=<output folder>                  default ai_review_bundle
  EXPORT_MODE=update_pack|new_pack|repo_maintenance
                                          update_pack (default): pack .txt only, NO tools.txt (fastest; ~60 KB)
                                          new_pack: lean kit — SKILL.md + instruction markdowns only, NO Python scripts
                                          repo_maintenance: full bundle with all scripts
  AI_SKIP_TOOLS=1                         legacy override: do not write <label>_tools.txt (overrides EXPORT_MODE)
"""
import os, re, pathlib

EXPORT_MODE = os.environ.get("EXPORT_MODE", "update_pack").strip().lower()
# Tool files for new_pack: instructions, UI assets, and generator/validator scripts per SKILL.md & PACK_GENERATOR_INSTRUCTIONS.md
LEAN_TOOL_FILES = [
    ".agents/skills/mcpe-new-pack/SKILL.md",
    "PACK_GENERATOR_INSTRUCTIONS.md",
    "INSTRUCTIONS.md",
    "DOCS_RULES.md",
    "scripts/make_pack_script.py",
    "scripts/build_payload.py",
    "scripts/import_project_payload.py",
    "scripts/doc_template.py",
    "scripts/pixel_json_to_png.py",
    "scripts/crafting_template.py",
    "scripts/CRAFTING_TABLE.svg",
    "assets/aln-ui-redesign/README.txt",
    "assets/aln-ui-redesign/design.json",
    "assets/aln-ui-redesign/font/README.txt",
    "assets/aln-ui-redesign/font/pixelify.js",
]

AI_PROMPT = r'''# AI Instructions

Repo: https://github.com/AllensCreations/MCPE-Curseforges.git (branch main)
Export: two plain .txt files. `<name>.txt` = the pack (index, these instructions, every file). `<name>_tools.txt` = SKILL.md, PACK_GENERATOR_INSTRUCTIONS.md, INSTRUCTIONS.md and the helper scripts. Read both before changing anything. The zip root also holds SKILL.md: read it FIRST for a new pack.

## Pack work (create or update)
- UPDATE: the pack files are in `<name>.txt`. Change only what was requested.
- Vanilla limit blocks a mechanic: use a modular workaround per INSTRUCTIONS.md 1.12, never drop the feature silently.
- NEW pack: read SKILL.md first, then follow PACK_GENERATOR_INSTRUCTIONS.md Part 4 and deliver ONE pack `.sh` from `scripts/make_pack_script.py` (the project travels inside it as base64). NEVER deliver separate zip, pack, json, js or b64 files.
- INSTRUCTIONS.md wins over PACK_GENERATOR_INSTRUCTIONS.md on any conflict. These instructions win over both on the reply format and the Termux script.
- Update: keep pack and module UUIDs unchanged.
- Vanilla reference: `reference/bedrock-samples/bedrock-samples.min.json.gz` (Download: https://github.com/AllensCreations/MCPE-Curseforges/raw/main/reference/bedrock-samples/bedrock-samples.min.json.gz; gzip file of ~8 MB, holds every vanilla Mojang behavior/resource pack JSON once unzipped: `.behavior_pack.entities.zombie`, `.behavior_pack.recipes`, `.resource_pack.entity` ...). Never guess a vanilla component, event, loot or recipe shape: copy the shape from it or https://github.com/Mojang/bedrock-samples.
- UI work (menus, forms, HUD, screens): follow INSTRUCTIONS.md 1.13 and apply the ALN UI Redesign skin from `assets/aln-ui-redesign/` (README.txt, design.json, font/README.txt in the tools txt). Textures are not exported; if the pack's resource_pack is missing, ask for it. Never claim anything was tested in Minecraft unless it was.
- Update: deliver the repo change as the Termux script below. New pack: the pack `.sh` above. Never a separate payload or base64 file.

## Destination
Repo-root-relative folders for this work:
__DEST__
- .sh paths start at repo root, stay inside these folders. New files go here too.
- First folder -> `DEST=` variable at script top. Use it for every path and `git add`.

## Rules
1. NEVER invent features, versions, links, assets, test results.
2. Output only what changed. Smallest edits. No unrelated rewrites.
3. No notes/summaries/explanations unless asked.
4. Any project type (add-on, map, script, workflow, website). Keep folder layout. New project = own new folder beside similar ones.

## Update request = ONE Termux script
- Name: `<Repofilename>_<Version>_<RAND>.sh` (e.g. `Monster-Companions_v2_k7q2x.sh`). Deliver as downloadable file.
- Repofilename: project/folder/file changed. No extension, no spaces (hyphens ok).
- Version: new vX format. Update = X+1 (e.g., v1 -> v2, or legacy 1.3.4 -> v2).
- RAND: >=5 random lowercase letters/digits. Fresh every script. NEVER reuse (earlier reply or existing file), so a new script never overwrites or re-runs an old one.
- Same exact name in reply steps.
Script order:
1. `#!/data/data/com.termux/files/usr/bin/bash` + `set -e`
2. `cd "$HOME/MCPE-Curseforges"`; `git clone` repo URL first if folder missing
3. `git pull --rebase`
4. Apply ALL changes as exact search-and-replace edits: write a spec and run `python3 scripts/make_update_script.py spec.txt` (format in `scripts/apply_update.py`; `--verify <clone>` dry-runs it). The tool applies edits atomically, sets the manifest version and writes both changelogs. Size decides the method. SMALL update (a few edits, under about 60% of any file touched): search and replace only. LARGE update (most of a file, many new files, a redesign): use the best method, `@@ create`/`@@ overwrite` in the same spec, never many fragile edits. Either way ONE `.sh`. No separate downloads.
5. Validate every changed .json with python3. Stop on error.
5b. Verify top CHANGELOG.md heading == new vX == script filename version. Stop on mismatch. If project has manifests: run `python3 scripts/manifest_tools.py --project "$DEST" --set X.0.0` (or `vX`), then `python3 scripts/manifest_tools.py --project "$DEST" --check` and `python3 scripts/validate_manifest_titles.py --project "$DEST"`. Stop on error. Every update must change the manifests so the build changes. Never hand-edit manifest JSON for versions.
5c. If INSTRUCTIONS.md or PACK_GENERATOR_INSTRUCTIONS.md changed: run `python3 scripts/check_instruction_files.py`. Stop on error
6. `git add` changed paths only; `git commit -m "<short message>"`; `git push`
6b. Add an entry to the ROOT `CHANGELOG.md` (repo-wide, newest first under `---`): `## [vN] - YYYY-MM-DD - [Update Name]` (N = `REPO_VERSION` + 1, a single whole number such as v80, set by the update tool, never by hand), groups `### Added` / `### Improved & Balanced` / `### Fixed`, bullets `- **Title**: what changed`. Every script, tooling-only included.
7. After push, do NOT start any workflow. Build Changed Packs & Sync Catalogs runs by itself on every push and rebuilds everything. Nothing auto-bumps; Publish to CurseForge uploads the newest changelog version as written.
8. Idempotent: skip anything already applied.
9. Last line, reached only after a successful push: `rm -f -- "$SELF"` (the script deletes itself; save `SELF="$(readlink -f -- "$0")"` on line 2, before the `cd`).

## Docs (every update, same script)
- Templates STRICT: README.md, DESCRIPTION.md, CHANGELOG.md match templates below exactly: same headings, text, order, labels, bullet format. NEVER add/remove/rename/merge/reorder sections. No boilerplate/extra text. No placeholders: fill every [bracket] with verified content. Accuracy + requested scope outrank template.
- CHANGELOG.md: MANDATORY every update, no exceptions. Add new release entry for the change.
- README.md + DESCRIPTION.md: after change, analyze both in destination folder. Edit ONLY if change makes them inaccurate/incomplete. NEVER remove verified content.

### Versions (vX ONLY)
- Format: single-number version `vX` (e.g. `v2`, `v3`). Old 3-part versions X.Y.Z convert by incrementing major (X+1).
- Update: X+1 (v1 -> v2, v2 -> v3).
- New vX goes in CHANGELOG heading + script filename.
- Manifest versions: Bedrock requires a 3-integer array, so `vX` is mapped internally to `[X, 0, 0]` by `manifest_tools.py --set vX` (never hand-edit JSON). NEVER hand-edit README download links. Build Changed Packs & Sync Catalogs aligns a pack to its highest existing version and rebuilds.
- NEVER put release version in README/DESCRIPTION titles. NEVER reuse a heading.

### Changelog views
- `changelog_views/<Name>.github.md` (newest open, older folded by minor series) and `changelog_views/<Name>.curseforge.html` (CurseForge spoilers, paste into project description): generated from CHANGELOG.md by `scripts/build_changelog_views.py`.
- CHANGELOG.md = plain text, exact template format, only source of truth. NEVER add HTML/fold markup/links to it. NEVER edit views by hand. NEVER create/change views inside the .sh.
- Refresh: Build Changed Packs & Sync Catalogs; Collect Files for AI Review (tick commit_changelog_views to save); or `python3 scripts/build_changelog_views.py --project <Name>`.

### Writing
- Player-facing only. In-game display names, never identifiers, file names, JSON, events, code.
- "Behavior Pack" / "Resource Pack", NEVER BP/RP.
- README: no code blocks, emojis, hype, badges.
- DESCRIPTION: exactly the two Minecraft Bedrock + Format badges from repo template, no others. May keep existing item sprites + recipe diagrams.
- No Markdown tables. Use `### Feature Name` cards with `- **What Happens**: ...` bullets.
- Paragraphs <=4 sentences. Verified facts only. Verification line = source created | package built | in-game tested, NEVER mixed.

### README.md (add-on): download landing page only, EXACTLY 11 non-empty lines
```
# [Name]

Download the current release of **[Name]** for Minecraft Bedrock Edition.

## Download

- **Package format:** `.mcaddon`
- **Direct download:** [Download [Name] (.mcaddon)](link)

## Installation

1. Download the package using the link above.
2. Open the downloaded file with Minecraft to import it.
3. If the package contains a pack that must be enabled separately, activate it in your world's settings.

## Pack Information

For gameplay features, usage details, compatibility notes, and other project information, read the [full description](DESCRIPTION link).
```
Maps/scripts/minigames: same landing page. Use real package format; .mcworld = tell players to open the imported world. Product details live in DESCRIPTION.md.

### DESCRIPTION.md order
1. `# [Name] — [subtitle]` (no release version)
2. `**By ALNStudios**`
3. Two exact badges (Minecraft Bedrock "Stable Release", Format) from repo template
4. Summary
5. `## Overview`
6. `## Key Features`
7. `## How to Use`
8. `## Compatibility`: Minecraft Bedrock Edition, Experimental features, Achievements, Verification
9. `## Creator and Permissions`: `- Creator: ALNStudios`, `- Profiles:` CurseForge https://www.curseforge.com/members/allenscreations/projects · MCPEDL https://mcpedl.com/user/alnstudios/, then the two clickable listing images (HTML, `width="45%"`, no `height`, raw URLs `assets/Images/curseforge.jpg`, `assets/Images/MCPEDL.jpg`). NEVER edit/copy the images
10. `## Guidelines and Attribution`
11. `---` then `## Search & Discovery Keywords` from real features
- Add-ons: Achievements line ALWAYS `Likely achievement-friendly`; add caveats if world settings/cheats can disable achievements.

### Guidelines and Attribution block, exactly
```
- Creator: ALNStudios
- Rights & Reservation: All rights reserved for ALNStudios.
- Content Creators: Content creators are permitted to feature this creation in videos and streams with credit to ALNStudios.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.
- Disclaimer: This is an unofficial community creation. It is not an official Minecraft product and is not approved by or associated with Mojang or Microsoft.

---

© All rights reserved for ALNStudios.

---
```

### CHANGELOG.md
- `# Changelog — [Name]`, `---`, then newest first: `## [vX] - YYYY-MM-DD - [Update Name]` (date: `TZ=Asia/Singapore date +%F`). [Update Name] = short player-facing title (2-6 words) of what is new. REQUIRED on every new entry.
- Groups: `### Added`, `### Improved & Balanced`, `### Fixed` (bugs as in-game experience). Omit empty groups. Each group >=1 bullet.
- Entry: `- **Title**: player impact.`
- NO links, URLs, badges, function/event names, unverified benefits. No boilerplate after title.
- Insert new entry directly under `---`, above previous release. NEVER edit/delete older entries.

### Item and Block Components
- When defining `menu_category` for custom items or blocks, `group` MUST start with a namespace (e.g. `minecraft:itemGroup.name.<group>` or `<namespace>:itemGroup.name.<group>`). Unnamespaced group strings like `itemGroup.name.helmet` fail Bedrock parsing (`Failed to parse field ' -> description -> menu_category -> group: string must be prefixed with a namespace (eg. namespace:value)'`). If no vanilla group applies, omit `group` and provide only `category`.

## Reply Format (STRICT)
```
[SYSTEM_CONFIG]
Mode: Direct Execution
Token_Efficiency: Maximum
Rules: no greeting, intro, outro, offers, restating. High technical accuracy.
```
Output ONLY these three sections, in order, exact headings:
1. **File Needed:** repo-root-relative path of each file created/edited.
2. **Changelog:** bullets, brief summary of changes.
3. **Termux Script:** ONE fenced `bash` block holding ONLY the run commands: `bash ~/storage/downloads/<Repofilename>_<Version>_<RAND>.sh` (a new pack may add the same line with `stage`). The .sh is attached, NEVER pasted. NEVER a Summary section.
- The .sh (`<Repofilename>_<Version>_<RAND>.sh`, random chars included) is the downloadable file. Exact same name in the command.
- NEVER text before, between, after. NEVER rename/merge/reorder/skip a section. Nothing to report: `- None`.
- Unclear request: ask ONE line, then proceed with defaults.
- First-time Termux setup, ONLY if the user asks:
```
pkg update -y && pkg install -y git python curl
termux-setup-storage
git config --global user.name "ALNStudios"
git config --global user.email "your-email@example.com"
git config --global credential.helper store
```
- Push password = GitHub Personal Access Token (repo + workflow scopes), NOT account password. Same token starts the build after push.
'''

raw_paths = [p.strip().strip("'\"") for p in re.split(r"[,\n]", os.environ["PATHS"]) if p.strip()]
_kw = [p.upper() for p in raw_paths]
new_pack      = _kw == ["NEW"]          # new-pack kit: tools txt only
update_kit    = _kw == ["UPDATE"]       # update-pack tools kit
repo_kit      = _kw in (["REPO"], ["MAINTENANCE"], ["TOOLS"])  # repo-maintenance tools kit
if new_pack or update_kit or repo_kit:
    raw_paths = []


def safe(x):
    return re.sub(r"[^A-Za-z0-9._-]+", "_", x).strip("_.")

def auto_label():
    names = []
    for e in raw_paths:
        last = [c for c in pathlib.PurePosixPath(e.rstrip("/")).parts if c not in (".", "")]
        n = safe(last[-1]) if last else ""
        if n and n not in names:
            names.append(n)
    if not names:
        return "export"
    label = "+".join(names[:3]) + ("+more" if len(names) > 3 else "")
    return label[:80]

label = ("New-Pack" if new_pack else
         "Update-Pack" if update_kit else
         "Repo-Maintenance" if repo_kit else
         (auto_label() or "export"))


root = pathlib.Path(".").resolve()
SKIP_DIRS = {".git", "db", "node_modules", "__pycache__", "exports", "ai-review"}
selected, skipped, missing = {}, [], []
dests = []

def is_text(p: pathlib.Path) -> bool:
    try:
        head = p.read_bytes()[:8192]
    except OSError:
        return False
    if b"\x00" in head:
        return False
    try:
        head.decode("utf-8")
    except UnicodeDecodeError as e:
        # a multi-byte char cut at the 8 KB boundary is fine
        return e.start >= len(head) - 4
    return True

def add(p: pathlib.Path):
    try:
        rel = p.resolve().relative_to(root)
    except ValueError:
        return  # outside the repo
    if any(part in SKIP_DIRS for part in rel.parts):
        return
    if not p.is_file():
        return
    if is_text(p):
        selected[rel.as_posix()] = p
    else:
        skipped.append(rel.as_posix())

for entry in raw_paths:
    if ".." in pathlib.PurePosixPath(entry).parts or entry.startswith("/"):
        missing.append(entry + "  (not allowed: must be inside the repo)")
        continue
    matches = sorted(root.glob(entry))
    if not matches:
        missing.append(entry)
        continue
    for m in matches:
        try:
            d = (m if m.is_dir() else m.parent).relative_to(root).as_posix() or "."
            if d not in dests:
                dests.append(d)
        except ValueError:
            pass
        if m.is_dir():
            for f in sorted(m.rglob("*")):
                add(f)
        else:
            add(m)

# Always include the docs next to (or one level above) each destination,
# so the AI can see the current CHANGELOG.md and version. add() ignores missing files.
for d in list(dests):
    for base in (root / d, (root / d).parent):
        for doc in ("CHANGELOG.md", "README.md", "DESCRIPTION.md"):
            add(base / doc)
    view_name = pathlib.PurePosixPath(d).name
    for ext in (".github.md", ".curseforge.html"):
        add(root / "changelog_views" / (view_name + ext))
    add(root / "Package" / (view_name + ".listing.md"))

files = sorted(selected, key=str.lower)
if missing:
    for m in missing:
        print(f"::warning::Path not found or not allowed: {m}")
if not files and not (new_pack or update_kit or repo_kit):
    raise SystemExit("::error::Nothing matched. Check the paths (case-sensitive, relative to the repo root).")


# Detect the current version from every exported CHANGELOG.md (top release heading)
version_lines, top_versions = [], []
for rel in files:
    if pathlib.PurePosixPath(rel).name != "CHANGELOG.md":
        continue
    text = selected[rel].read_text(encoding="utf-8", errors="replace")
    mv = re.search(r"^## \[(?:v)?(\d+)(?:\.(\d+)\.(\d+)(?:\.(\d+))?)?\]", text, re.M)
    if mv:
        first, b, c, d = mv.groups()
        if b is not None and c is not None:
            if d is not None:  # legacy X.Y.Z.A -> X.Z.A
                first, b, c = first, c, d
            a, b, c = int(first), int(b), int(c)
            # Legacy X.Y.Z converts to v(X+1)
            v_curr = f"v{a}"
            v_next = f"v{a + 1}"
            version_lines.append(f"CURRENT VERSION: {v_curr} / NEXT UPDATE: {v_next}  ({rel})")
            top_versions.append(v_curr)
        else:
            v_num = int(first)
            version_lines.append(f"CURRENT VERSION: v{v_num} / NEXT UPDATE: v{v_num + 1}  ({rel})")
            top_versions.append(f"v{v_num}")

blocks = []
for rel in files:
    data = selected[rel].read_bytes().decode("utf-8", errors="replace")
    runs = re.findall(r"`+", data)
    fence = "`" * max(3, max((len(r) for r in runs), default=0) + 1)
    head = f"## FILE: {rel} ({data.count(chr(10)) + 1} lines, {len(data.encode('utf-8'))} bytes)"
    blocks.append((rel, f"\n{head}\n\n{fence}\n{data.rstrip(chr(10))}\n{fence}\n"))

out = pathlib.Path(os.environ.get("AI_OUT", "ai_review_bundle")); out.mkdir(parents=True, exist_ok=True)
name = f"{label}.txt"
index = ["- **Export request:** " + ", ".join(f"`{r}`" for r in raw_paths),
         "- **Destination:** " + ", ".join(f"`{d}`" for d in dests)]
index += [f"- **{v.split('  (')[0]}**  (`{v.split('  (')[1].rstrip(')')}`)" for v in version_lines]
index += [f"- **Text files:** {len(files)}", f"- **Skipped binary:** {len(skipped)}", f"- **Paths not found:** {len(missing)}", "", "### Files in this export", ""]
index += [f"- `{r}`" for r in files]
if missing:
    index += ["", "### Not found", ""] + [f"- `{m}`" for m in missing]
if skipped:
    index += ["", "### Skipped (binary)", ""] + [f"- `{x}`" for x in skipped[:1000]]
instructions = AI_PROMPT.replace("__DEST__", "\n".join("- " + d for d in dests) or "- .")
content = ("# Repo Export\n\n## Index\n\n" + "\n".join(index) + "\n\n---\n\n"
           + "## AI Instructions\n\n" + instructions.replace("# AI Instructions", "", 1).strip() + "\n\n---\n\n"
           + "## File Contents\n" + "".join(b for _, b in blocks))
(out / name).write_text(content, encoding="utf-8")

# OTHER: instruction files + helper scripts in ONE txt (text only; binaries are named in the index)
# Skip tools.txt entirely for update_pack mode (or when AI_SKIP_TOOLS=1) — pack .txt has everything needed
skip_tools = os.environ.get("AI_SKIP_TOOLS") == "1" or (EXPORT_MODE == "update_pack" and not update_kit and not repo_kit and not new_pack)
# new_pack / UPDATE keyword: lean kit (instructions + UI assets only, no Python scripts)
# repo_maintenance / REPO keyword: full bundle with all scripts
if EXPORT_MODE == "new_pack" or new_pack or update_kit:
    tool_files = LEAN_TOOL_FILES
else:

    tool_files = [".agents/skills/mcpe-new-pack/SKILL.md", "PACK_GENERATOR_INSTRUCTIONS.md", "INSTRUCTIONS.md", "DOCS_RULES.md"] + [
        "scripts/" + t for t in (
            "build_payload.py", "import_project_payload.py", "crafting_template.py",
            "generate_recipe_images.py", "convert_crafting_recipe_svgs_to_png.py",
            "ensure_recipe_unlocks.py", "make_pack_icon.py", "optimize_images.py",
            "manifest_tools.py", "doc_template.py", "pixel_json_to_png.py", "make_pack_script.py", "make_update_script.py", "apply_update.py", "CRAFTING_TABLE.svg")] + [
        "assets/aln-ui-redesign/README.txt", "assets/aln-ui-redesign/design.json",
        "assets/aln-ui-redesign/font/README.txt", "assets/aln-ui-redesign/font/pixelify.js"]
t_ok, t_missing, t_blocks = [], [], []
for rel in tool_files:
    p = root / rel
    if not p.is_file() or not is_text(p):
        t_missing.append(rel)
        continue
    data = p.read_bytes().decode("utf-8", errors="replace")
    runs = re.findall(r"`+", data)
    fence = "`" * max(3, max((len(r) for r in runs), default=0) + 1)
    t_ok.append(rel)
    t_blocks.append(f"\n## FILE: {rel} ({data.count(chr(10)) + 1} lines, {len(data.encode('utf-8'))} bytes)\n\n{fence}\n{data.rstrip(chr(10))}\n{fence}\n")
t_index = [f"- `{r}`" for r in t_ok]
if t_missing:
    t_index += ["", "### Not found / not text", ""] + [f"- `{m}`" for m in t_missing]
t_index += ["", "### Binary helpers (stay in the repo, not exported)", "",
            "- `scripts/CRAFTING_TABLE.png`", "- `assets/Images/`", "- `assets/aln-ui-redesign/`", "- `Mcpeworlds/assets/`"]
if not skip_tools: (out / f"{label}_tools.txt").write_text(
    "# Pack Tools and Instructions\n\n## Index\n\n" + "\n".join(t_index)
    + "\n\n---\n\n## File Contents\n" + "".join(t_blocks), encoding="utf-8")
with open(os.environ.get("GITHUB_OUTPUT") or os.devnull, "a", encoding="utf-8") as fh:
    fh.write(f"label={label}\n")
    fh.write(f"artifact_name={'(' + top_versions[0] + ') ' + label if top_versions else label}\n")
print(f"Exported {len(files)} files into {out}/{name}" + (f" and {len(t_ok)} tool files into {label}_tools.txt" if not skip_tools else f" (tools.txt skipped: mode={EXPORT_MODE})") + f"; skipped {len(skipped)} binary; {len(missing)} path(s) not found.")
