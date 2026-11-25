#!/usr/bin/env bash
# ============================================================
#  MCPE-Curseforges  ·  Snapshot Uploader  (gum edition)
#  Run:  ./upload
# ============================================================

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MCPEDL="$REPO_ROOT/MCPEDL"

# ── gum check ────────────────────────────────────────────────
if ! command -v gum &>/dev/null; then
  echo "❌  'gum' is not installed."
  echo "    Install it with:  apt install gum  or  pkg install gum"
  exit 1
fi

# ── theme ─────────────────────────────────────────────────────
export GUM_CHOOSE_CURSOR="▶ "
export GUM_CHOOSE_CURSOR_FOREGROUND="#00FFAA"
export GUM_CHOOSE_SELECTED_FOREGROUND="#00FFAA"
export GUM_CHOOSE_HEADER_FOREGROUND="#FFD700"
export GUM_FILE_CURSOR="▶ "
export GUM_FILE_CURSOR_FOREGROUND="#00FFAA"
export GUM_FILE_SELECTED_FOREGROUND="#00FFAA"
export GUM_FILE_HEADER_FOREGROUND="#FFD700"
export GUM_CONFIRM_PROMPT_FOREGROUND="#00FFAA"
export GUM_CONFIRM_SELECTED_FOREGROUND="#000000"
export GUM_CONFIRM_SELECTED_BACKGROUND="#00FFAA"

# ── header ────────────────────────────────────────────────────
print_header() {
  clear
  gum style \
    --foreground="#00FFAA" --border-foreground="#00FFAA" \
    --border=double --align=center --width=54 --padding="0 2" \
    "📸  MCPE Snapshot Uploader  ·  ALN Studios"
  echo ""
}

# ── category icons ────────────────────────────────────────────
declare -A CAT_ICON=(
  [Addons]="🧩 Addons"
  [Script]="📜 Script"
  [Maps]="🗺  Maps"
  [Minigame]="🎮 Minigame"
)
CATEGORIES=("Addons" "Script" "Maps" "Minigame")

# ── get packages in a category that have assets/snapshots/ ────
get_packages() {
  local cat="$1"
  find "$MCPEDL/$cat" -mindepth 1 -maxdepth 1 -type d \
    -exec test -d '{}/assets/snapshots' \; -print 2>/dev/null \
  | sort | xargs -I{} basename {}
}

# ── file browser using gum file ───────────────────────────────
pick_files() {
  local start="/sdcard/Download"
  [[ -d "$start" ]] || start="/sdcard"
  [[ -d "$start" ]] || start="$HOME"

  gum style --foreground="#FFD700" "📂  Browse to your images and select them"
  gum style --foreground="#888" --italic "  (space = toggle · enter = open dir or confirm)"
  echo ""

  # gum file with multi-select
  local picked
  picked=$(gum file \
    --file \
    --all=false \
    --height=20 \
    "$start" 2>/dev/null)

  echo "$picked"
}

# ── upload confirm & copy ─────────────────────────────────────
do_upload() {
  local pkg_path="$1"   # e.g. Addons/ALN-SoulLantern
  shift
  local files=("$@")
  local target="$MCPEDL/$pkg_path/assets/snapshots"
  local pkg_name
  pkg_name="$(basename "$pkg_path")"

  print_header
  gum style --foreground="#FFD700" --bold "  📦 Package : $pkg_name"
  gum style --foreground="#888"    "  📂 Target  : $target"
  echo ""

  # Preview list
  gum style --foreground="#00FFAA" --bold "  Files to upload:"
  for f in "${files[@]}"; do
    [[ -n "$f" ]] && gum style --foreground="#FFFFFF" "   + $(basename "$f")"
  done
  echo ""

  if ! gum confirm "Upload ${#files[@]} file(s) to $pkg_name?"; then
    gum style --foreground="#888" --italic "  Cancelled."
    sleep 1; return
  fi

  echo ""
  local ok=0 fail=0
  for f in "${files[@]}"; do
    [[ -z "$f" ]] && continue
    local fname
    fname="$(basename "$f")"
    if cp "$f" "$target/$fname" 2>/dev/null; then
      gum style --foreground="#00FFAA" "  ✔  $fname"
      ((ok++))
    else
      gum style --foreground="#FF5555" "  ✘  $fname  (failed)"
      ((fail++))
    fi
  done

  echo ""
  gum style --foreground="#00FFAA" --bold "  Done! ✅  Uploaded: $ok   Failed: $fail"
  echo ""

  if gum confirm "Stage files with git add?"; then
    git -C "$REPO_ROOT" add "$target/"
    gum style --foreground="#00FFAA" "  ✔  Staged. Run git commit when ready."
  fi

  echo ""
  gum style --foreground="#888" "  Press Enter to continue..."
  read -rs
}

# ── main ──────────────────────────────────────────────────────
main() {
  while true; do
    print_header

    # ── Step 1: pick category ──────────────────────────────────
    local cat_labels=()
    for c in "${CATEGORIES[@]}"; do
      cat_labels+=("${CAT_ICON[$c]}")
    done

    local chosen_label
    chosen_label=$(gum choose \
      --header="  Select a Category:" \
      --height=8 \
      "${cat_labels[@]}") || { echo ""; exit 0; }

    # Map label back to raw category name
    local chosen_cat=""
    for c in "${CATEGORIES[@]}"; do
      if [[ "${CAT_ICON[$c]}" == "$chosen_label" ]]; then
        chosen_cat="$c"; break
      fi
    done

    # ── Step 2: pick package ───────────────────────────────────
    print_header
    gum style --foreground="#FFD700" --bold "  ${CAT_ICON[$chosen_cat]}"
    echo ""

    local pkg_list
    mapfile -t pkg_list < <(get_packages "$chosen_cat")

    if [[ ${#pkg_list[@]} -eq 0 ]]; then
      gum style --foreground="#FF5555" "  No packages with assets/snapshots/ found."
      sleep 2; continue
    fi

    local chosen_pkg
    chosen_pkg=$(gum choose \
      --header="  Select a Package:" \
      --height=15 \
      "${pkg_list[@]}") || continue

    local pkg_path="${chosen_cat}/${chosen_pkg}"

    # ── Step 3: pick files ─────────────────────────────────────
    print_header
    gum style --foreground="#FFD700" --bold "  📦 $chosen_pkg"
    echo ""

    # gum file returns one file at a time — loop to pick multiple
    local picked_files=()
    local start_dir="/sdcard/Download"
    [[ -d "$start_dir" ]] || start_dir="/sdcard"

    gum style --foreground="#FFD700" --bold "  🖼  Pick images to upload"
    gum style --foreground="#888" --italic "  Navigate with arrow keys · Enter to select"
    echo ""

    while true; do
      local f
      f=$(gum file --height=18 "$start_dir" 2>/dev/null) || break

      if [[ -z "$f" ]]; then break; fi

      # Only allow image files
      local ext="${f##*.}"
      ext="${ext,,}"
      if [[ "$ext" =~ ^(png|jpg|jpeg|webp|gif)$ ]]; then
        picked_files+=("$f")
        gum style --foreground="#00FFAA" "  ✔ Added: $(basename "$f")"
      else
        gum style --foreground="#FF5555" "  ✘ Not an image: $(basename "$f")"
      fi

      echo ""
      if ! gum confirm "Add another file?"; then break; fi
      echo ""
    done

    if [[ ${#picked_files[@]} -eq 0 ]]; then
      gum style --foreground="#888" --italic "  No files selected."
      sleep 1; continue
    fi

    # ── Step 4: upload ─────────────────────────────────────────
    do_upload "$pkg_path" "${picked_files[@]}"

    # ── Step 5: loop or exit ───────────────────────────────────
    print_header
    local next
    next=$(gum choose \
      --header="  What next?" \
      "📸  Upload to another package" \
      "🚪  Exit") || break

    [[ "$next" == "🚪  Exit" ]] && break
  done

  print_header
  gum style --foreground="#888" --italic "  Goodbye! 👋"
  echo ""
}

main "$@"
