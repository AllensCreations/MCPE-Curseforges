#!/usr/bin/env bash
# ============================================================
#  MCPE-Curseforges  ·  Snapshot Uploader TUI
#  Browse your device, pick images, upload to any package.
# ============================================================

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MCPEDL="$REPO_ROOT/MCPEDL"

# ── colours ──────────────────────────────────────────────────
R='\033[0m'
BOLD='\033[1m'
DIM='\033[2m'
CYAN='\033[1;36m'
YELLOW='\033[1;33m'
GREEN='\033[1;32m'
RED='\033[1;31m'
BLUE='\033[1;34m'
WHITE='\033[1;37m'
MAGENTA='\033[1;35m'

# ── terminal helpers ──────────────────────────────────────────
cls()         { printf '\033[2J\033[H'; }
cursor_hide() { tput civis 2>/dev/null; }
cursor_show() { tput cnorm 2>/dev/null; }
trap 'cursor_show; echo' EXIT

print_header() {
  cls
  echo -e "${CYAN}${BOLD}"
  echo "  ╔══════════════════════════════════════════════════════╗"
  echo "  ║      📸  MCPE Snapshot Uploader  ·  ALN Studios      ║"
  echo "  ╚══════════════════════════════════════════════════════╝"
  echo -e "${R}"
}

divider() { echo -e "${DIM}  ──────────────────────────────────────────────────────${R}"; }

read_key() {
  IFS= read -rsn1 _key
  if [[ "$_key" == $'\x1b' ]]; then
    read -rsn2 -t 0.1 _seq
    _key="$_key$_seq"
  fi
}

# ── generic arrow-key menu ────────────────────────────────────
# menu <title> <hint> <result_var> item1 item2 ...
# returns index in _menu_idx, value in result_var
menu() {
  local title="$1" hint="$2"
  local -n _res="$3"
  shift 3
  local items=("$@")
  local n=${#items[@]} sel=0
  cursor_hide
  while true; do
    print_header
    echo -e "  ${YELLOW}${BOLD}${title}${R}"
    divider
    echo -e "  ${DIM}${hint}  |  q = quit${R}\n"
    for i in "${!items[@]}"; do
      if [[ $i -eq $sel ]]; then
        echo -e "  ${GREEN}${BOLD} ▶  ${items[$i]}${R}"
      else
        echo -e "  ${DIM}    ${items[$i]}${R}"
      fi
    done
    read_key
    case "$_key" in
      $'\x1b[A') ((sel=(sel-1+n)%n)) ;;   # up
      $'\x1b[B') ((sel=(sel+1)%n))   ;;   # down
      '')        break                ;;   # enter
      q|Q)       cursor_show; cls; echo -e "  ${DIM}Goodbye! 👋${R}\n"; exit 0 ;;
    esac
  done
  cursor_show
  _menu_idx=$sel
  _res="${items[$sel]}"
}

# ── multi-select file browser ─────────────────────────────────
# browse <start_dir> <result_array_var>
# result_array_var is filled with selected file paths
browse_files() {
  local dir="$1"
  local -n _selected="$2"
  _selected=()

  local -A checked   # checked[path]=1
  local cur=0

  while true; do
    # Build entry list: [..] dirs first, then image files
    local entries=()
    local entry_types=()   # "dir" or "file"

    # parent dir
    if [[ "$dir" != "/" ]]; then
      entries+=("..")
      entry_types+=("dir")
    fi

    # subdirectories
    while IFS= read -r -d $'\0' d; do
      local name
      name="$(basename "$d")"
      entries+=("$name")
      entry_types+=("dir")
    done < <(find "$dir" -maxdepth 1 -mindepth 1 -type d -not -name '.*' -print0 2>/dev/null | sort -z)

    # image files
    while IFS= read -r -d $'\0' f; do
      local name
      name="$(basename "$f")"
      entries+=("$name")
      entry_types+=("file")
    done < <(find "$dir" -maxdepth 1 -mindepth 1 -type f \
      \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" \
         -o -iname "*.webp" -o -iname "*.gif" \) \
      -print0 2>/dev/null | sort -z)

    local n=${#entries[@]}
    [[ $cur -ge $n ]] && cur=0

    cursor_hide
    # draw
    print_header
    echo -e "  ${YELLOW}${BOLD}📁 File Browser${R}"
    divider
    echo -e "  ${DIM}↑/↓ navigate  |  Space = toggle select  |  Enter = open dir / done  |  q = quit${R}"
    echo -e "  ${CYAN}${BOLD}📂 ${dir}${R}\n"

    for i in "${!entries[@]}"; do
      local name="${entries[$i]}"
      local type="${entry_types[$i]}"
      local full_path="$dir/$name"
      [[ "$name" == ".." ]] && full_path="$(dirname "$dir")"

      local icon tick prefix suffix
      if [[ "$type" == "dir" ]]; then
        icon="📂"
        tick="   "
      else
        icon="🖼 "
        if [[ "${checked[$full_path]}" == "1" ]]; then
          tick="${GREEN}${BOLD}[✔]${R}"
        else
          tick="${DIM}[ ]${R}"
        fi
      fi

      if [[ $i -eq $cur ]]; then
        prefix="${GREEN}${BOLD} ▶ "
        suffix="${R}"
      else
        prefix="${DIM}   "
        suffix="${R}"
      fi

      echo -e "  ${prefix}${tick} ${icon} ${name}${suffix}"
    done

    # count selected
    local sel_count=${#_selected[@]}
    echo ""
    divider
    if [[ $sel_count -gt 0 ]]; then
      echo -e "  ${GREEN}${BOLD}${sel_count} file(s) selected${R}  — press ${GREEN}Enter${R} on a ${YELLOW}folder${R} or ${GREEN}[Done]${R} below to confirm"
    else
      echo -e "  ${DIM}No files selected yet. Use Space to toggle image files.${R}"
    fi

    # Done button at the bottom
    if [[ $cur -eq $((n)) ]] 2>/dev/null; then
      echo -e "  ${GREEN}${BOLD} ▶  ✅  Done — Upload selected files${R}"
    else
      echo -e "  ${DIM}     ✅  Done — Upload selected files${R}"
    fi

    cursor_show
    read_key

    case "$_key" in
      $'\x1b[A')   # up
        if [[ $cur -eq 0 ]]; then cur=$n
        else ((cur--)); fi
        ;;
      $'\x1b[B')   # down
        if [[ $cur -ge $n ]]; then cur=0
        else ((cur++)); fi
        ;;
      ' ')   # space — toggle
        if [[ $cur -lt $n ]]; then
          local name="${entries[$cur]}"
          local type="${entry_types[$cur]}"
          local full="$dir/$name"
          if [[ "$type" == "file" ]]; then
            if [[ "${checked[$full]}" == "1" ]]; then
              unset "checked[$full]"
              # remove from _selected
              local tmp=()
              for s in "${_selected[@]}"; do
                [[ "$s" != "$full" ]] && tmp+=("$s")
              done
              _selected=("${tmp[@]}")
            else
              checked[$full]="1"
              _selected+=("$full")
            fi
          fi
        fi
        ;;
      '')  # enter
        if [[ $cur -eq $n ]]; then
          # Done button
          break
        elif [[ $cur -lt $n ]]; then
          local name="${entries[$cur]}"
          local type="${entry_types[$cur]}"
          if [[ "$type" == "dir" ]]; then
            if [[ "$name" == ".." ]]; then
              dir="$(dirname "$dir")"
            else
              dir="$dir/$name"
            fi
            cur=0
          fi
          # if it's a file, Enter also toggles (same as space)
          if [[ "$type" == "file" ]]; then
            local full="$dir/$name"
            if [[ "${checked[$full]}" == "1" ]]; then
              unset "checked[$full]"
              local tmp=()
              for s in "${_selected[@]}"; do
                [[ "$s" != "$full" ]] && tmp+=("$s")
              done
              _selected=("${tmp[@]}")
            else
              checked[$full]="1"
              _selected+=("$full")
            fi
          fi
        fi
        ;;
      q|Q)
        cursor_show; cls
        echo -e "  ${DIM}Goodbye! 👋${R}\n"
        exit 0
        ;;
    esac
  done
  cursor_show
}

# ── collect packages by category ─────────────────────────────
# collect_category_packages <category> <result_array_var>
collect_category_packages() {
  local cat="$1"
  local -n _pkgs="$2"
  _pkgs=()
  local cat_dir="$MCPEDL/$cat"
  [[ -d "$cat_dir" ]] || return
  while IFS= read -r -d '' dir; do
    if [[ -d "$dir/assets/snapshots" ]]; then
      _pkgs+=("$(basename "$dir")")
    fi
  done < <(find "$cat_dir" -mindepth 1 -maxdepth 1 -type d -print0 | sort -z)
}

# ── upload confirm & copy ─────────────────────────────────────
do_upload() {
  local pkg="$1"
  local target="$MCPEDL/$pkg/assets/snapshots"
  local -n _files="$2"

  print_header
  echo -e "  ${YELLOW}${BOLD}📦 Package :${R}  ${WHITE}$pkg${R}"
  echo -e "  ${YELLOW}${BOLD}📂 Target  :${R}  ${DIM}$target${R}"
  divider
  echo -e "  ${CYAN}${BOLD}Files to upload (${#_files[@]}):${R}\n"
  for f in "${_files[@]}"; do
    echo -e "  ${GREEN} +${R}  $(basename "$f")  ${DIM}← $(dirname "$f")${R}"
  done
  echo ""
  divider
  echo -e "  ${BOLD}Press ${GREEN}Y${R}${BOLD} to confirm  |  any other key to cancel${R}"

  IFS= read -rsn1 confirm
  if [[ "$confirm" != 'y' && "$confirm" != 'Y' ]]; then
    echo -e "\n  ${DIM}Cancelled.${R}\n"
    sleep 1; return
  fi

  echo ""
  local ok=0 fail=0
  for f in "${_files[@]}"; do
    local fname
    fname="$(basename "$f")"
    if cp "$f" "$target/$fname"; then
      echo -e "  ${GREEN}✔${R}  $fname"
      ((ok++))
    else
      echo -e "  ${RED}✘${R}  $fname  (copy failed)"
      ((fail++))
    fi
  done

  echo ""
  divider
  echo -e "  ${GREEN}${BOLD}Done!${R}  Uploaded: ${GREEN}$ok${R}  Failed: ${RED}$fail${R}"
  echo ""
  echo -e "  ${BOLD}Stage files in git now? ${GREEN}Y${R}${BOLD}/${DIM}n${R}"
  IFS= read -rsn1 gitin
  if [[ "$gitin" == 'y' || "$gitin" == 'Y' || "$gitin" == '' ]]; then
    git -C "$REPO_ROOT" add "$target/"
    echo -e "  ${GREEN}✔${R}  Staged. Run ${CYAN}git commit${R} when ready."
  fi

  echo ""
  echo -e "  ${BOLD}Press any key to continue...${R}"
  IFS= read -rsn1
}

# ── main ──────────────────────────────────────────────────────
main() {
  # Sensible start dir for browsing
  local start_dir="/sdcard/Download"
  [[ -d "$start_dir" ]] || start_dir="/sdcard"
  [[ -d "$start_dir" ]] || start_dir="$HOME"

  # Category icons
  declare -A cat_icon=(
    [Addons]="🧩"
    [Script]="📜"
    [Maps]="🗺 "
    [Minigame]="🎮"
  )
  local categories=("Addons" "Script" "Maps" "Minigame")

  while true; do
    # ── Step 1: pick category ─────────────────────────────────
    local cat_labels=()
    for c in "${categories[@]}"; do
      cat_labels+=("${cat_icon[$c]:-📁}  $c")
    done

    local chosen_cat_label
    menu "Select a Category:" \
         "↑/↓ to move  |  Enter to select" \
         chosen_cat_label "${cat_labels[@]}"

    # Strip icon prefix to get raw category name
    local chosen_cat
    chosen_cat="${chosen_cat_label##*  }"

    # ── Step 2: pick package within category ──────────────────
    declare -a pkg_names
    collect_category_packages "$chosen_cat" pkg_names

    if [[ ${#pkg_names[@]} -eq 0 ]]; then
      print_header
      echo -e "  ${YELLOW}No packages with assets/snapshots/ found in ${CYAN}${chosen_cat}${R}.\n"
      sleep 1; unset pkg_names; continue
    fi

    local chosen_pkg_name
    menu "📂  ${chosen_cat}  —  Select a Package:" \
         "↑/↓ to move  |  Enter to select  |  q = back to categories" \
         chosen_pkg_name "${pkg_names[@]}"

    local chosen_pkg="${chosen_cat}/${chosen_pkg_name}"

    # ── Step 3: browse & pick files ───────────────────────────
    declare -a picked_files
    browse_files "$start_dir" picked_files

    if [[ ${#picked_files[@]} -eq 0 ]]; then
      print_header
      echo -e "  ${YELLOW}No files selected. Going back to menu.${R}\n"
      sleep 1
      unset picked_files
      continue
    fi

    # ── Step 4: upload ────────────────────────────────────────
    do_upload "$chosen_pkg" picked_files

    # ── Step 4: what next? ────────────────────────────────────
    print_header
    echo -e "  ${BOLD}What next?${R}\n"
    local action
    menu "" "↑/↓ to move  |  Enter to select" action \
      "📸  Upload more snapshots to another package" \
      "🚪  Exit"

    [[ "$action" == "🚪  Exit" ]] && break
    unset picked_files
  done

  print_header
  echo -e "  ${DIM}Goodbye! 👋${R}\n"
}

main "$@"
