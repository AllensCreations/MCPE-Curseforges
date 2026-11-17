#!/data/data/com.termux/files/usr/bin/bash
set -e
SELF="$(readlink -f -- "$0")"

cd "$HOME/MCPE-Curseforges"
git pull --rebase

# ── Fix 1: publish-curseforge.yml — blank-line guard on --list-pending ─────────
python3 - << 'PYEOF'
import pathlib
f = pathlib.Path(".github/workflows/publish-curseforge.yml")
old = "mapfile -t PENDING < <(python3 scripts/auto_publish_curseforge.py --list-pending)"
new = "mapfile -t PENDING < <(python3 scripts/auto_publish_curseforge.py --list-pending | grep -v '^[[:space:]]*$')"
t = f.read_text(encoding="utf-8")
if new in t:
    print("publish-curseforge.yml: already patched, skipping.")
elif old in t:
    f.write_text(t.replace(old, new, 1), encoding="utf-8")
    print("publish-curseforge.yml: patched OK.")
else:
    raise SystemExit("ERROR: expected line not found in publish-curseforge.yml")
PYEOF

# ── Fix 2: collect-ai-review-files.yml — 3-mode toggle ─────────────────────────
python3 - << 'PYEOF'
import pathlib, re
f = pathlib.Path(".github/workflows/collect-ai-review-files.yml")
t = f.read_text(encoding="utf-8")

# Already done?
if "export_mode=update_pack" in t:
    print("collect-ai-review-files.yml: already patched, skipping.")
    raise SystemExit(0)

# ── inputs block: replace paths + refresh_package_files description ──────────
OLD_INPUTS = '''    inputs:
      paths:
        description: "Leave empty for the standard review bundle. Or paths to export, comma-separated: files, folders or globs, e.g. MCPEDL/Addons/Grand-Banquets, scripts, .github/workflows. Type NEW for a new-pack kit (tools txt only)."
        required: false
        default: ""
        type: string
      refresh_package_files:
        description: "Refresh the per-package ai-review files and the root README list now (same as the automatic run; ignores Paths)"'''
NEW_INPUTS = '''    inputs:
      mode:
        description: "Export mode"
        type: choice
        default: "update_pack"
        options:
          - "update_pack"
          - "new_pack"
          - "repo_maintenance"
      pack_path:
        description: "update_pack: pack folder path (e.g. MCPEDL/Addons/Mining-Helmet). Ignored for new_pack and repo_maintenance."
        required: false
        default: ""
        type: string
      refresh_package_files:
        description: "Refresh the per-package ai-review files and the root README list now (same as the automatic run; ignores mode/pack_path)"'''

if OLD_INPUTS not in t:
    raise SystemExit("ERROR: inputs block not found — file may have changed")
t = t.replace(OLD_INPUTS, NEW_INPUTS, 1)

# ── Choose mode step env + run block ─────────────────────────────────────────
OLD_MODE = '''      - name: Choose mode
        id: mode
        env:
          PATHS: ${{ inputs.paths }}
          EVENT: ${{ github.event_name }}
          REFRESH: ${{ inputs.refresh_package_files }}
        run: |
          if [ "$EVENT" = "workflow_run" ] || [ "$REFRESH" = "true" ]; then
            echo "auto=true" >> "$GITHUB_OUTPUT"
            echo "default=false" >> "$GITHUB_OUTPUT"
          elif [ -z "$(echo "$PATHS" | tr -d \'[:space:],\')" ]; then
            echo "auto=false" >> "$GITHUB_OUTPUT"
            echo "default=true" >> "$GITHUB_OUTPUT"
            echo "artifact_name=($(cat REPO_VERSION 2>/dev/null || echo 0)) ai-review-bundle" >> "$GITHUB_OUTPUT"
          else
            echo "auto=false" >> "$GITHUB_OUTPUT"
            echo "default=false" >> "$GITHUB_OUTPUT"
          fi'''
NEW_MODE = '''      - name: Choose mode
        id: mode
        env:
          MODE: ${{ inputs.mode }}
          PACK_PATH: ${{ inputs.pack_path }}
          EVENT: ${{ github.event_name }}
          REFRESH: ${{ inputs.refresh_package_files }}
        run: |
          if [ "$EVENT" = "workflow_run" ] || [ "$REFRESH" = "true" ]; then
            echo "auto=true" >> "$GITHUB_OUTPUT"
            echo "default=false" >> "$GITHUB_OUTPUT"
            echo "export_mode=repo_maintenance" >> "$GITHUB_OUTPUT"
            echo "paths=" >> "$GITHUB_OUTPUT"
          elif [ "$MODE" = "repo_maintenance" ]; then
            echo "auto=false" >> "$GITHUB_OUTPUT"
            echo "default=true" >> "$GITHUB_OUTPUT"
            echo "export_mode=repo_maintenance" >> "$GITHUB_OUTPUT"
            echo "paths=" >> "$GITHUB_OUTPUT"
            echo "artifact_name=($(cat REPO_VERSION 2>/dev/null || echo 0)) ai-review-bundle" >> "$GITHUB_OUTPUT"
          elif [ "$MODE" = "new_pack" ]; then
            echo "auto=false" >> "$GITHUB_OUTPUT"
            echo "default=false" >> "$GITHUB_OUTPUT"
            echo "export_mode=new_pack" >> "$GITHUB_OUTPUT"
            echo "paths=NEW" >> "$GITHUB_OUTPUT"
          else
            # update_pack (default)
            echo "auto=false" >> "$GITHUB_OUTPUT"
            echo "default=false" >> "$GITHUB_OUTPUT"
            echo "export_mode=update_pack" >> "$GITHUB_OUTPUT"
            echo "paths=${PACK_PATH}" >> "$GITHUB_OUTPUT"
          fi'''

if OLD_MODE not in t:
    raise SystemExit("ERROR: Choose mode step not found — file may have changed")
t = t.replace(OLD_MODE, NEW_MODE, 1)

# ── Build path export env block ───────────────────────────────────────────────
OLD_ENV = '''        env:
          PATHS: ${{ inputs.paths }}
        run: python3 scripts/collect_ai_review.py'''
NEW_ENV = '''        env:
          PATHS: ${{ steps.mode.outputs.paths }}
          EXPORT_MODE: ${{ steps.mode.outputs.export_mode }}
          AI_SKIP_TOOLS: ${{ steps.mode.outputs.export_mode == \'update_pack\' && \'1\' || \'\' }}
        run: python3 scripts/collect_ai_review.py'''

if OLD_ENV in t:
    t = t.replace(OLD_ENV, NEW_ENV, 1)

# ── Summary PATHS_IN ──────────────────────────────────────────────────────────
t = t.replace(
    "          PATHS_IN: ${{ inputs.paths }}",
    "          PATHS_IN: ${{ steps.mode.outputs.paths }}",
    1
)

f.write_text(t, encoding="utf-8")
print("collect-ai-review-files.yml: patched OK.")
PYEOF

# ── Commit & push ─────────────────────────────────────────────────────────────
git add .github/workflows/publish-curseforge.yml .github/workflows/collect-ai-review-files.yml

if git diff --cached --quiet; then
    echo "Nothing new to commit — already up to date."
else
    git commit -m "fix: curseforge publish blank-line guard + 3-mode AI review toggle"
    git push origin main
    echo ""
    echo "✅ Done! Both workflow fixes pushed."
fi

rm -f -- "$SELF"
