#!/data/data/com.termux/files/usr/bin/bash
# ALNStudios pack script: creates MCPEDL/Addons/ALN-SoulLantern from the payload stored at the end of this file.
#   bash ALN-SoulLantern_1.0.0_4m5dqd.sh          create the project here (Termux), build worlds, commit and push
#   bash ALN-SoulLantern_1.0.0_4m5dqd.sh stage    copy this file to MCPEDL/incoming/ and push, then run the GitHub workflow
#                            "Create Project from Base64" with payload_file = ALN-SoulLantern_1.0.0_4m5dqd.sh
set -e
SELF="$(readlink -f -- "$0")"
SCRIPT_NAME="ALN-SoulLantern_1.0.0_4m5dqd.sh"
NAME="ALN-SoulLantern"
DISPLAY_NAME='ALN SoulLantern'
VERSION="1.0.0"
PTYPE="addon"
REPO="https://github.com/AllensCreations/MCPE-Curseforges.git"
ACTION="${1:-create}"
case "$ACTION" in create|stage) ;; *) echo "Usage: bash $SCRIPT_NAME [create|stage]"; exit 1 ;; esac

cd "$HOME"
[ -d "$HOME/MCPE-Curseforges" ] || git clone "$REPO" "$HOME/MCPE-Curseforges"
cd "$HOME/MCPE-Curseforges"
git checkout -q -- Package changelog_views 2>/dev/null || true
git pull --rebase --autostash

for f in scripts/import_project_payload.py scripts/build_payload.py scripts/manifest_tools.py; do
  [ -f "$f" ] || { echo "ERROR: $f is missing in the repo."; exit 1; }
done

if git ls-tree -r --name-only HEAD | grep -q "^MCPEDL/[^/]*/$NAME/"; then
  echo "Nothing to commit: $NAME already exists in the repo."
  rm -f -- "$SELF"
  exit 0
fi

if [ "$ACTION" = "stage" ]; then
  grep -q "ALN PAYLOAD BEGIN" scripts/import_project_payload.py \
    || { echo "ERROR: the repo importer cannot read .sh files yet. Update the repo first."; exit 1; }
  mkdir -p MCPEDL/incoming
  cp -- "$SELF" "MCPEDL/incoming/$SCRIPT_NAME"
  git add -- "MCPEDL/incoming/$SCRIPT_NAME"
  git diff --cached --quiet || git commit -m "chore(incoming): stage $NAME pack script"
  git push
  echo "Staged. Now: GitHub > Actions > Create Project from Base64 > Run workflow > payload_file = $SCRIPT_NAME"
  rm -f -- "$SELF"
  exit 0
fi

mkdir -p MCPEDL/incoming
TMPB64="MCPEDL/incoming/$NAME.b64"
GO="$(mktemp)"
DONE=0
CREATED=0
DEST_REAL="MCPEDL/Addons/$NAME"
cleanup() {
  rc=$?
  rm -f -- "$TMPB64" "$GO"
  if [ "$rc" -ne 0 ] && [ "$DONE" != "1" ]; then
    git checkout -q -- . 2>/dev/null || true
    [ "$CREATED" = "1" ] && rm -rf -- "$DEST_REAL"
    echo "Failed. Nothing was pushed."
  fi
}
trap cleanup EXIT

sed -n '/^#--- ALN PAYLOAD BEGIN ---$/,/^#--- ALN PAYLOAD END ---$/p' "$SELF" | sed '1d;$d' | sed 's/^#//' | tr -d ' \r\n' > "$TMPB64"
[ -s "$TMPB64" ] || { echo "ERROR: the payload block is missing from this file."; exit 1; }

CREATED=1
python3 scripts/import_project_payload.py --mode create --payload-file "$NAME.b64" --github-output "$GO"
TYPE="$(sed -n 's/^type=//p' "$GO")"
DEST_REAL="$(sed -n 's/^dest=//p' "$GO")"

if [ "$TYPE" = "map" ]; then
  for m in Creative Survival Hardcore; do
    [ -f "Mcpeworlds/$m/level.dat" ] || { echo "ERROR: missing Mcpeworlds/$m/level.dat"; exit 1; }
  done
  python3 scripts/build_oneblock_variants_from_template.py
  python3 scripts/sync_oneblock_map_readmes.py
fi
python3 scripts/manifest_tools.py --project "$DEST_REAL" --align
python3 scripts/validate_manifest_titles.py --project "$DEST_REAL"
python3 scripts/build_listing_kits.py --project "$DEST_REAL" 2>/dev/null || true
python3 scripts/build_changelog_views.py --project "$NAME" 2>/dev/null || true

NAME="$NAME" DISPLAY_NAME="$DISPLAY_NAME" TYPE="$TYPE" python3 - <<'ALN_LOG'
import os, pathlib, subprocess
date = subprocess.check_output(["date", "+%F"], env={"TZ": "Asia/Singapore", "PATH": "/usr/bin:/bin:/data/data/com.termux/files/usr/bin"}, text=True).strip()
title = f"New {os.environ['TYPE'].capitalize()} {os.environ['DISPLAY_NAME']}"
p = pathlib.Path("CHANGELOG.md")
t = p.read_text(encoding="utf-8")
if f"## {date} - {title}" not in t:
    entry = f"## {date} - {title}\n\n### Added\n- **{os.environ['DISPLAY_NAME']}**: New {os.environ['TYPE']} project created from a pack script.\n\n"
    i = t.index("---\n") + 4
    p.write_text(t[:i] + "\n" + entry.rstrip("\n") + "\n" + t[i:], encoding="utf-8")
ALN_LOG

git add -A -- "$DEST_REAL" CHANGELOG.md Package/ changelog_views/
if git diff --cached --quiet; then
  echo "Nothing to commit"
else
  git commit -m "feat($TYPE): create $NAME from pack script"
  git push
fi
DONE=1
rm -f -- "$SELF"
exit 0
#--- ALN PAYLOAD BEGIN ---
#UEsDBBQAAAAIAAAAIVAznxnqZgEAADcCAAAMAAAAQ0hBTkdFTE9HLm1kXZGxjhMxEIb7fYpfShfFUZLiCrochNNJBwVBokAUE3tu
#Y87rsWwv0XU8BE/IkzDeXSioVuP555v/n13h7ZViz0F6/P75C8enjzjLGJ4oVs6x64wxXbda4et+u9vuvsHgsDvcmf3eHA5avPe5
#VHziwFS4CVc4OseuM1ivGwgLab1+gyNspudKl8DIHLzFzdcrKOI0pPqKIPKilQOhD3LzsZ+8mHsZ9bF1txP3g1xgKdUxc8OeI9M8
#59sqsnXhYlBhFRSmAF8383NprhLl6m3gsuyzVz/wTL+XUpCyVLbVy2T885Vxio4z3mXqJW7wRUmc9UvZsdaNcgpN8TDqk9dMlmKU
#igtP+9kt9CD2paVvB2vsx/88XyaBul400EUo9IPdFEei9hLkWQPNxHPy2VcMHMeZV5I6n8ZqppR0sEXeKDDSwNMhJLeE35uO9Iea
#wlY0wblNZj3WMYTXv4bu/rWtSHByi9vuD1BLAwQUAAAACAAAACFQYt+Q5CUHAAAUEQAADgAAAERFU0NSSVBUSU9OLm1ktVfbbtzI
#EX3nV1RkeBMLQ46teB1AWDmQR/IFK9mGtImxMPahh6wZtkWy6e7mTCZP+Yj8RL4g7/sp+ZKc6ibnopG8xi72RfY0m1Wnqk6dKj6g
#04u3dG266kI1nm1D//vXv+maVUW1mTrSDSmyXOmcVFPI/1g5Jl9yjYPVsmTLSXJ4+GIlhq59V2jjDg+T5OMfPl7qhnOrZp5ecGFN
#fvPTn0rvW3c8Hut6nrlSc1W4TJvxVBVzHq/vPzx63L+RXns1rRgHV9FzOrV6Xvq5ZW7+6vyq4pNZpXzqPnfK8jeVmZuTerDzaONw
#rn3ZTbPc1OPTquLGTSwrr03jxpeT9+fppLOOZ8bO2T0S7C+NrZX/BcDxUprBwunke4B8+JcJ/uL36dnZu7fbBx/eXV2cpdOq433U
#vxYm0h4KhTpIsWKtpJTU13IkdWrWRdOejKXWmk+ce1w9epw6zg3Ket3ixMIUnK4yKd9zmoTKwQBVPTNm1tQ0r5Rz1KqG3Yi0NQ01
#3XzOHr+cuHZGV+Im/gBnRoE4Cthq9uXKeXKlskWPLVfWroAF3tuWC8ol3s4yLZEJWpkuS5IHD+jdgu1C8zJJbtNVFYUj03BP0vCa
#XxqqjLlxGf0A/Od161c7iaHSoJBwO1O68Yim4lAbqrXzEbAELq+kL0wnGdp+e16ZpetddfZzZzSyGwKeaUCX12eVQd2aOXE9ZesQ
#xXXD6iY802JFoQTBggq184ac1BI10o3TBUfoQ+pdKR4F05CgPzpqkNERlXjNlxH0QlmNN+IPJA/p3Sk/OMcW2QqUmVZosJje73lF
#L6NdJwcPduMNVEAwSUqHhx9K5em1VKtBox/fwZMQ1tEuU57e4sqTPToI5Cf3cCiLoC6RqIlqBeadUL6c4mWpKw6Vl7ogMZEXPeqY
#b7m3UI12Jffa55baAswsgmmV9Tqv8HDgyBA0QDVuQ4ce8QuDFLy3xqO/0MV3og4UbQoU5syquUHXfgBotvgXieEmpua8khuvoBcF
#SiyFbYynKQfacLFLF29BuwGloqWyTYgZPpXF6dQsgoYjG36qbA/2Wi3QgZJkqK7ne8EOXm6Y20hKpA18HJiYd85DKSI91Rx/clMZ
#xONxUpAT4yPiz51uax7YutBVhbtWlKAQxshh1xa4i0p49PiyCSbDA5hj6RnIb14OuRY+Uz8n7gT/5hYrQgfc5sV216/zaaitVB5z
#5kKahClGnrRCDu13C2C554MJr0SmhcCHXLfaoiEvuenuhPo3NOydUEBKsai0FeMG94XeMNPrkQCEmmtJ4b0CIZDl5qC6wu01sK1R
#cC8FgkMRl800EVFEAkfrHklhBpmFppt2ddujpA9zDDOI4gyCVr+BFnirb1BwNLKdrlAU56U4sor0A2Mm7KCpQuHQ5Ga7B0dDXZ+t
#B1tuUFYwpw/uigODeg0JXL8zxFe674+9saS22R0noh/yId5N56lzkUhv5coPah419rVZSsVQ2CR5kvWyuTuvSclJ3qsthdUnS44y
#vFttJtJmujvRu9FXzJQs+XMWKHVrqn2BVOFmJKkElyVPgbk0Bkbe9zXfoUrw1tW1DBfyXLfGKkz2kqtWpAylviP58pKNx4G4gYbf
#Zl/VqPeEEiyul9T9Ng21mJi6xXie6kr7VQIK7K2qdF5oUexjepIdPcuePZYIGl4yxDKl838gKC3ihehn/eA8preGeP0EMKBwEGL5
#f8EyAbgYMo0Z38aDGWJyYvM0x3q5CNdh6scggZujdGY1NwW2M1z9O1zMdK4iQCTB5v1iwBikMhcgmr23OZLbBy0XEIXQ5T1brDpO
#FksJv390vLXD4xR1DuiO6WPYO1/K3jmcbnbW5XKZ5eu9NOyuddx6xirssPl6h+3Vwj2in/9LH2WjPbvYN1jnaLkqGOocW1hpXAQ1
#xtL7naLS8uzk4Df4P3j+HRZ6cjbfmLFqmcX1W5xCPTzS/lWb+LjGFjnGsoPNZvymVnK0BehTOz8gSPDJwSaLB2B24cuTg6ffPgSY
#sXpOe3F9IQ2/P/5Ymy3s8WAfd6DWqw4ba4UeihvHqYeMT7uw8dzLriv5jnP0DXQBeBc9mYGVbHxiw7m0CEi7eVUaYBKjGyyDocNJ
#3p8QvquoFZZ7aQSoQt+maD/taKCEdMgC2E0EjvHDqu5Xe9yBBsiru86vcOzWAR7TmQktZzntWmz9RfTQyoSKn1vigApIAQQN+she
#/xOQZCyF69NVK7nHALzQzU1/MQqqSIWZodU1dMZya5xGcCsYB68A5Uy7vFKQGytjGV61xEFds34J9a+7Biq3DjnMWdwTzLi7vrmR
#QEAuOpnpMlf6i63EwQJWggJeg5cksyFVl+aTgiTjyaXOrXFmJkKbpmmS/Pyfr6ppvCz7ByZ/XoIWEhtcIlp8nSyNLaBU+zKNz79U
#Vubbn4XD89pAEXuhGe5uiVl/bbSD5f9QSwMEFAAAAAgAAAAhUCcki8apAQAABAMAAAkAAABSRUFETUUubWStUsFu2zAMvesrCOTQ
#NkhkbLv1lsUZECBpg3a3YkBpiXbUyJIh0Q3y96PdpGt73s0m+Z7e4+MEFps7eIy932BgSkGpMh6Dj2iB9wSmT4kCQyJPmAliDdPp
#F8h0CnVMsHWBTMKa4SfZFM0BVtaxi0ErNZnAhVapuVDs0BywoQHYIt8KxbNuDVobw/M4ULpEhsGeUcPE07uyLwLg+oK9+XO9Z+7y
#bVE0jvd9pU1si4X3FPIyEQ5ycrFd7lbzZZ8yyfMN5YITUdGiC2Or3BSLgSwXD6tFuV3p1t6MFtYhM3o/sij1TcOnVXVnS312oRkr
#3oUDYBVfSavvGu47CmP9Yoos1M4THEXqh/VxBNd2MTE41uqHhnX96QETA4vWDDiWpIcMbZ8ZKgIKWHkhztRhQiZ/mgEadq/yLXzg
#Apxin+AYk7dXWeaYRW9+C2mIRWy+pTK6/CXJNthS5/EEtWywT5RnYnJQYkmEePmVLXcCqJx3fIIQeZjBYCGK8ARdii9Dmu4f80xO
#6ry4p7r3XriySa4bev83RDmW+YdjKcrV4/Jhvfu9vr8bktXqL1BLAwQUAAAACAAAACFQ6GgiUwoBAABKAgAAJQAAAGJlaGF2aW9y
#X3BhY2svaXRlbXMvc291bF9sYW50ZXJuLmpzb251UUtuwyAU3OcUFuvISrrIwmforgdAr/g5QuVj8R5W3Mjn6T16soLtuEZNFwhp
#Zph5j7kfqkp0PlhgOWAg7Z1oKnGuXy715SSOmbbaoQrQcaMZbaLvCU14i6SC7nl5s4AJ1i061p3GkJ3AuIZ8NNKAYwxutpx1Fl2U
#ChivPow7g0TtUJEzSazcNN/T4iGUt713KY32+b/jWrhJYlAfkvQnJs35+FekVTF+4hhvHANSgc77dhANr1vJYqtNNz0mfRLVauoN
#jNKBxTJyABMzJL6/3t+Sb/Va+j5zi4QSnE7NraVRP14NEIl/xNa3cy3lYiJTbQwPm1O9/VJ28AOmonh7nH+xLOOQz3T4AVBLAwQU
#AAAACAAAACFQCrhgvgkBAAAqAgAALAAAAGJlaGF2aW9yX3BhY2svaXRlbXMvc291bF9sYW50ZXJuX2ZpbGxlZC5qc29ufVHLTsMw
#ELznKyKfQApRC1IPOXLmxgdYS7xBK/yIvHbUUuV7+h/9MuwklEZQLpY1szs7O3ssylJ0zhsIckDP5KxoSrGtH3f1biOqTBuy2Hro
#QkMBTaKPCU24Qm499WHumcEEk0IbqCP0WQm0bdhFLTXYgN7KjrRGJabqsZqVWmd6Z1MbXwv9zDWwlxyg/ZBMn5hqttXvImpXPhIX
#cB+iR16hk/EOog6LPXnT3mRx+Y1/TFTEvYaDtGBwPXkAHTMkzqe31yRfvszy5fn0dJeBh2cXrboX/6hHRgmW0mWWo3B/eNfALG4U
#G6em2Nf7ikyp6L9lNvUlvKzgBjQp+EtzDre4Xj2/YzEWX1BLAwQUAAAACAAAACFQ5Ax2T8QBAABnBAAAGwAAAGJlaGF2aW9yX3Bh
#Y2svbWFuaWZlc3QuanNvbq1TTY+bMBC951dYPrVSzBpscNjT9r7qJceqigY8JKzARLaJFEX73+vwlbSb9lDtBTwevzfz5uOyIoRW
#nW3B705oXd0Z+kyS9fX6gKDRBvMSrGAbaDFY9Nvrd7Lt+uYVjEdryJdTHPGIf6Xr8Z1GV9r66EcuukVoHGm7wpHaEBigZMaC0cRi
#g+DQEX/AljQQHBEpziTE2fpe152bmfu+1lfKItVC8kIwiWXCpMaSAUpkYpNnsUhA6jSZMTdVP4YLQuL1dODLYfj/nBBtbXZo9rXB
#3T/ASTafsgkevu9D4dpO9w26BXWZHlJ/Pg4V1OCBzvBFVYaJRqU4g0JIJkHLoAo1gwwh5xWi0HhDfUztLrk7bbO6McEpxQc5jT27
#8Tdg9j3sB98bnOBPPxpvzzege2qhNtGb+6hLlQI2uapYhjlnUqkNgzSPWSy4SmReSJ6qT9C1mjoY5u+IRqMp60c9WLLKMiljIVil
#MGWyiEWoe1qykhdFgqEFvMg+v9rjaOzmVXoJs4alhco/ObQhyKOINIlUxOl/8bG+/gslXyiXwrXoYRjNZeWh94fOujvZ9G4rf9ua
#ow2plH43zxNoHUJdd2L1vvoFUEsDBBQAAAAIAAAAIVBr/BVGDwEAAJQCAAAsAAAAYmVoYXZpb3JfcGFjay9yZWNpcGVzL3NvdWxf
#bGFudGVybl9zYW5kLmpzb26Fkj9vhDAMxXc+BcqMKtGRjYmN5dSpqiIXDBddcFBi2qIT370JfwTcDTfaee8X5zn3KI5FY2wHLH/Q
#OmVIZLFI39J3kYSzThFWFhrOLFaqR+mu0GPtRXd/7AU1usqqnhfn0vRtVSOxahTawANNmTODlhqI0ZJ0QLWYtVOycBha56WfG2C+
#VFErGb41LtqvVdsDB8pRXhalSLaiyIu9KC/l2X3D8ThpeSjC4IxdGHl/uLKGJA1tiyxW3bRf9crdanBO9kD4bM5fmaFDvo6OQ+q2
#fgZcXgHm0PewvfcU+kDaVLdDjgdYZfyq/jjwcv0Lo/uYxfiA2lK16AbNpy+wTvO4/H01lRkoWNJo403RFP0DUEsDBBQAAAAIAAAA
#IVCK8k7WDwEAAJQCAAAsAAAAYmVoYXZpb3JfcGFjay9yZWNpcGVzL3NvdWxfbGFudGVybl9zb2lsLmpzb26Fkj9vhDAMxXc+BcqM
#KtGRjYmN5dSpqiIXDBddcFBirkUnvnsT/gjoDTfaee8X5zmPKI5FY2wHLO9onTIkslikb+m7SMJZpwgrCw1nFivVo3RX6LH2ooc/
#9oIaXWVVz4tzafq2qpFYNQpt4IGmzJlBSw3EaEk6o7SYtVOycBha56WfG2C+VFErGb41LtqvVdsDB8pRXhalSLaiyIu9KC/l2X3D
#8ThpeSjC4IxdGHl/uLKGJA1tiyxW3bRf9crdanBO9kD4bM5fmaFDvo6OQ+q2fgZcXgHm0PewvfcU+kDaVLdDjgdYZfyqfjnwcv0D
#o/uYxVifUVuqFt2g+fQF1mn+L39fTWUGCpY02nhTNEV/UEsDBBQAAAAIAAAAIVCXVHbfXwMAAC0HAAAjAAAAYmVoYXZpb3JfcGFj
#ay9zY3JpcHRzL2xpYi9SRUFETUUubWSVVU1vEzEQvedXjNRLkdItSHCJEKK04UN8CLWIHiPvejYx8dor20nYf88be5MGUpC4tPba
#43nvzbzJGcUmmD7FS2vqyeRoc0krb3Uk56n6Eak1liMNnCqabzkMaWXckqzZ4qtxh1c6ZRyuV5PJ2Rm9lZjJ5OLP0xkFXpqYOERS
#1tKd31j6pBw+OKp5pbbGh4puuGcHBN7R6844boJq02XkgPyknD79erEx1VE6YXE7v7r5PK86PSNALjwKuvuVSjQiIu0L0jfc+sAX
#vGWXJHFv1YBsRrCpJhl82pm0QnrCDZOGGSmKjtVa5Bhvi3CyVdbNIrgt7MgtsrIROJiSCktGel9X9A17LAjootqyHjPQzgerKaaw
#adImMJ3njIZFETs8mZJJ0F5nKbSJkpxagISouB0TiGjhIPlM4o4UeA5OdaahPviegzw2zfGHOzU3vuN4gn0B4Szr6n80otr6Zj37
#21sS2HDRoxB/4CqwfU++zaeNNc0a5/m9KboHJMbALFyLXHuN5Yh2oBo5TUmz5bTPsX+9UA6MtYtSyj8BCsurFqsHklmcTeS/s4Gg
#riS6600wKC67DZ1rTspYyPw1+B/cJJzib1CWrqwdpnSbydC16gWaps++flI90jorvwNWgu2SwLuFOVSSLkumg/ospqQX2DVrGCwb
#J+4zwWTSNkoo0fOnT8utKa2Z+wy5I7RwyOD9znGYIlbtRjq9QqM0Fk0bwKSIp1WnlrkTOYfWAyrhxNIjkmcjFMF6nxvZeqXF+Z2X
#mWG5TV6MfGjqpJZL8AfzRcwCFpt+0NmYH6B/PBV/+q9GveXG9PxI1CL6TOTkM6hJ4M2JS/Y+Gmst3TArUI3ODy3S0HNZST3LatWX
#/536eVjXqh7K6tAZsik9Lcnnea6IHLNjMejuYA6jjzm9DEDtu1dFro8OBcRc7jAc8kDzMQL++dxpiH0T1NJDtHv4U6p8r4Jm7OdW
#Tt9tsDXKYbQUTwu20PkA6yAHdl++XsdcfxTfYdA0yjmfMDTyaCuqv/cxYciKM48v9KX9pcLSx7+5QMK+Q1m8GuRiyzHKGMFEXHOP
#8OHRIVFvklyRBGIPJz9EeSbAePLktccg9js3QsZo2vLeC4ExH2i34hJSZm1gadLcs1/wKAaH4MWry1ybX1BLAwQUAAAACAAAACFQ
#3yGxN/0RAAByPQAAHQAAAGJlaGF2aW9yX3BhY2svc2NyaXB0cy9tYWluLmpz7TttU9zI0d/vVwwqJ5HOa3kBH3dZjiMY8B0VbCgv
#d46Lh8CsNMsqaCWVpAUWwu/x//AvS3fPi0Yvu+u7JJUnVeEDkmZ6enp6+n1mo2mW5iV7ZHdpHoc9VsyLUkx77Aj+D0se3PTYYVJG
#5Xw/BchEJOXZPBOFbj3gU34t9vmsED02LPNZUM5yMeS34m0aCvbExnk6Zc6fplEigpyPy5eFyG9F7mx/FemZ94IySpM3aT494CXv
#MRjJY/25GMWLWQRYvgrSpCjZ4dvTs4+XRwdshzk8TgZFOosvY56UIk8ASgK9OTo+PjxYAHU5juJYhAZ4eHr0/ujs8mzvRwV9WWRR
#HpUtgKP9Pw8B5FW/r3v2T06OD04+vDN96xtV58Hh65Of3+0fms7vdM8vh++HRyfvcLp1v+/3q9W9PhkODxE2EXdsKEr33DHcGIgk
#FPllmPPrNHF6zOq5i8oJsLrexvNQNOBEjBiuZ9AV8cS58DRF707OLoeHe8d7r48PF8yexXzenIPn0zS/LEqehPWOJAsakNcgUNaE
#Bx9pmefOh0lUCoQ9yXlyTW9vCZjj63F0PQGuxDPq+CjiOL2T7VNqOY2SG3z+mPN5Ba+/9uecGHA6y7OY4DWm13l6l8iBQjLpvQgl
#AGiCc6HJ3PvLyfHJ2bEk9XgWENoPUUywP6byqach5BdmL/98+BGGPX7FWBGFAyVZEYyAlhJUSzXhK7UlfKrb8JXaJplqmWT0PeX3
#P+kmeNfNIz6aq1Z8pbZQlDyKC9WsvqgnF9ZU8gPanwzhUvwLJQdveeaabQtSWDOwrrMz5kUpVbzeq7pL2D3ocKUg9QBXnMKjFPel
#x3Z+IE6V+ZyejEkoP02GAW7RQVRgi18INcVrnrtXzx4JydOzR8TydAWTMbAjAS+DCXOFxx6frHUhApuAKFw8Lz6G6SwJXYBaihX+
#A2sTkZ+MK+SEWKG6FqUxqW6XifWPklt4T/O5t+sbdNYEChjRCxq/gPZcgE1OmISpz9u1CnsMrFSMYdqQoGymAUA5RzpxehTWI5oa
#wMALRMm1biNsfi5g1YFwX/71/K+Di68HL0EvHNUHOxiVrnOpv6cgHu4drePODyY83yvdvueX6c9ZJvJ9XgjXY8+hr4gjQLnuqXF/
#S6PEdZhTiRYIm3FJRyESSlivjOl/9ijdnR/M8hz5HgU3MJFaweaWByL0lpcTfxynae7SK9ijMJ0Cpq/Z+ta3f9xa3/LqQ67M/KNZ
#MW9sPnK3UgvorLQDd0aB+mpf1C4Q6NrOTrUd7Pe/Z23S2QsJ+n3DyWzjxslZpzy/aZBkUVDYFPQ6ZkDejmeJ1GZSsmM+ErHa7B67
#5WDspAxFYy0XbAdIt43+PQwsY8fT67v6hefgeEr27FFb1nPCdMF2dyVO5OoynMVEiMzC+AEsEqBDf/JrUd2l8dhhf/876+4GTbHm
#2U/jmOdLZ7JA02WQTxZrc8HDo2ScKsX2LLmZCB6XE9hDYwCM9ltUSiiHpEiOU6YeXdZF1Up7uAoZATlghYhWzT05tCaWnp7Fz2bF
#xLUERBkfLSfU41nU3SoJWEGJAmvRooe3lKQ2L3V3CmKNbEscFV7lQioV2lhFKAJdLqJWYljGuatTXmJQCiQQsCJAsn3JtFFxWYLf
#Dh2vgdA5k82WQEpDL0OO+vZQhwwGVAd+nPFrlFfHkf0YgyhZ3GXSMpJjlG3aaPyC60ZT2ffYS/jPBqwvx6uYZQkKMR4LUAdIJfh9
#JwoZ36xiCIU+Xp3dcryJhTSrpAsBBB4CPLV1kjIit8D/tk6C5UajCrnSmMfxiHqVsTcCDgA0Ds38wRwYGgWneQoerZy7N7QvZmdu
#yeZUcrxr0MLab7claRpxKX0wOg8ILWkLaxyYJTcJRrWWBMvgzhokG8gntwSEolQNWKBbcCR7oCsTQSSAf1U0QDYV3bOrhyD7iS8F
#tIP4MPc1tHgOLMUgkrKmyALLq8caqiqR012TrMf6Xk2UdBd9Vr1ml3W/arAQq/V37fk4F8VEhZntjcegoikXyEG501prdtjV50+j
#z59iCB1jdizzzc+fcvb50+YL+Dd69hj6eu2hr9gqvYfEBI75OM2Fe07kArZvh5r3nz+NcbgZ1DMg74irql+jd96Brjg22E+kbQZw
#kj29xCdx0YY70HxUgNqhNJBiMmezsLiL8tgNoylYfYErl/wbg+9wY9AbCDEy4FB/W759DxouX58/18GoikPyWXIGCV46K13X0i8j
#1TyMZujf1v1XEAkRtq9Z31/f3FZwZs4bOeENzPYKHtVMFTbIOmNBOqvQfItCfQOvZKhOj9AYbWybUVW4Lf9gwbAn/C455XkZBbFw
#7WgFg89MdYC9sQcydj9QnPLvYU6aLkgLlyjCsFMutFcbMzdj5jDGEN3/pg72YMAeNOoCTN4S1E9etcZGsqMa6fnU05NueCpXsGRg
#NMuLcokMWPuxvlHbkPpmNPm/JWmzef8b+b6K531/q+JKndl9f1OKxu/YpgTdrEBXMdzCqznd4nKdl4ng+Wh+FBZtfrZSPl2wQaaA
#9aMsE4yE+8jiFCYBdJq8HhpRMHMlTwIwGt8BNTIRE6RpAjOS5aminqtj+8mGmsktsntsJEAIxALyfxvZ4yiGHk35mpzBn/DC/YJV
#yNi4Tj7Qtc8zTCJNjaDkORAGMg/xo+0PTJpO8aGpAOh0a9uK4uPQhtnFhWLN1SWUOthbqxCCmcVBu3Ysq6ueOh8xiQ2R50cFhF+R
#zGCUA67Dyboi8UYNUVm7Z5U9zKIdmfr6I/B4N46SVizfVBCfP1GB72wimO3rgIViOopF4bOzSVQw1EMGzzJNWZbeiXwM32XKCnBF
#vlMLhuR2SHLtcmQH0ZSzyRboBMfrVjVc6lyrQkW9gR0pk157c2Wic2UBT5K0JMpZCWtbQL7c9QhSOhUxUHYnqbDEAuQb+tUitLBb
#OVw0rbrhQyRFrT+QtbRHNGdW3QIQ+fdeD+1Wo3UOrQ+t1gfPDjALlKBGLUVqeaWwdHjgFxrgLU/4Ndi8AFZaijd5Ov2AAC6Fj0r/
#41j/11Y4SoJ4ForXQMINhBkksb16nzYFA5h7ZjoLddwwaJ9A+DSxBHxaoPoLRZjEtIijLIMgnN/xOYgvLJlfg0Yu3WcK2lS10xyk
#uOb4ocfWvVps18wHTKhdqELQUkgZ8qNs0evqATKspgH4unoABtsEPslWA6vwm+DpffUQmSPQCHxdPcCE8DRGfancpSNiJ2GVWgOG
#KL0VrtY5aVxxGmN8e8yK46vglZSKNIkUibSHvP93pEKkN0rE6lZzhPLsA5/LCcSxl/IzmOBRhSSsIX4jEL+rIdgTAYnXs0ezTWjB
#rESr2m8qDjQc1nsRC6yUary0BJr6OA3+437LaILtkLoyKhzp2eW6dIwJUqRKOQVVXalYt0bNK1QaXI467WOTNA4LlqSk5AuUGUNT
#NFHbdqw6w2xlfRuf3++wV1hkWiMgaGnGrYE2xprzSnjMJ0rQLCMBMm0P0vhWLuEOsKhQiGyjG3g2wCS6njQhaFI9m5xmnWaphFTy
#FLDvQpywF+W4EESlPj3tTALbA9NKVznIXKBvB9aCJoIRzXgg0LnnUiTBSyrLipBLzaiM8TQPcWqKzvv+N3Jd2DDXDQ+q4UE22B5M
#hoBkj7ti5y9yZfL8IvSbLuyx2211O6zf6IIC+BcyDDNGQrMxXMy5TptWd0U6cERPRGjaGVrbkKnwL81HSwyXMjxkujqLGtKuLs3o
#UdJCVZSqMnPSQLmhgoEdWJ1V2Fl9Mz8XVnVGz9WV6eZ5O9dtJZ0LZCYEXpRKaFrJnUEMqfOrhgHX56nHYlyao5rKWs9g0aSa+th1
#8dGRAm2UE7GGSjEf+Ge331NQL7oPfGzCRBIO6RjYRTWYiqKAhdqkYf1FHRQTUVFlvtcK29prIMUjBVcxFUcUvio/60RmrUpkNOul
#4BpIExSDj9NtOo42lQzTYwcDcl9byTfV6+U66dDNB37jbpDwqy8j/ZohjQrYbDpNE6Mp/27f+2u8bQwCZgmSLW8aHYH8wPrLrP4V
#mirtWcH25wLPba/BN6MZkNUUEcUS10u20feeiqtO82Up+TkFwBeo6kpYvJpsEOt9ld5Wwt+Q0eqEpe5bFsQZdp6lcHbkWVnV207S
#FiRhGaRg0g3PG+3tJCxrpGD/c4RKBCxXWPIbaJ3wbFEMsdzH6LO8ENmx2pVUERMO8WORXOMhLEhev7JF/xTxNvnaxyi9Twswz0gn
#zV2kU6GrW2bmmnfTFz7AvAN3qXA2hhQqJvafO1PEKnLnwiruNvxSExXt5XbdC1o8URQu9tVI+HJvXDfFK33wguhzzzBLBk6yOANR
#U5anfxNBaYVNi/mtdkuy+7x/ISHsJd2XOdfLqq6hLNgNgm6tr3N17chC0uLzMGzUs7brAPWjpu7QC4+bXGkavavt1gSHdNzqOqAL
#qqAKHK1dcnzOXvVR0fk0i6NxJPIBewUmepLe6WK7VvuOYra1TO378bqJmh+NyaM6bR4ogB4jEz9gepfBsg+6rr08r5GJse59+VNU
#DiDOeTKpkg6VVt5xAXT1C5wKRXeI/Guz/e6w2cHjPBCTmO3F8bySVpK6jT4rBEheqIuLEDFuyhiDF/MkYNZxJe66KlaH/y8jjqV+
#F1Y71ZcE7UvArrriBdKBBzrAs/fyrFgvFcBH+v4Y3vl7EwFi13kHiAgOIg9+K5iYZuUcc1EQVZ57xHi0E/KuIwggxAp8FstbCwOT
#F9ARp6NkCWsAoCLbjQMLDHz5HY/kInxUCpufiw4cask1YoGp4OEHqH8x3gtpMpBuksBk6sYZAuOMRHKx64O9krc0PB8Apq6n7BMo
#7uaGzWp0efbedm8tga3eWwJbVKzTtwsU5Vi4cSAJqRKSgbo31lG/o4+lxboKokuxGnOanPoPhRSMO15IYUDPAIRcmaSbShhSfEK6
#CYTXtPyrTr2DxSZvRTLryNWQyCpaLGBPUa+H0HoE679frGuVPv67tW5FEqBCxzTEu4z/BRcQKvKMQVVDdCoDgnBVpSiLMxS8ooJc
#m+urDeqC0P/VbtNYRqv+S4a61QKi4s+ftv60d/xuWM7CKC2AKFE7S/r8KQfK3dtnj+qnAE/elcKB7Hfxn/6elSXklCjlp9JZsLoL
#cTf6hee0oZcYTg21H6eF8lb/OWOHMNgnNYYuj8tguyubxgECw47uUeveUs9IGi2zHRntH+K968KXQEe4NzwoP0SlTBHmfjEbFUEe
#jTAMv21c631kzTPiSFfdgC87TNzq1Zn2ziNdqmnrOKUYQsJ2A7Jqc0jcKsbhkWBe3S7EW8d6N2x4vEjY1usvsE9VIqUyqFUH4shR
#vCn8RTyldPELWUrRlMVReC3eRBCWEfYv4m+nkVzEyrUaetiRfzlv7XqDjBU7yg3yVLg6SDBFB/s4oWqcV+cJVaM6Vejay86zotgc
#E9V3k49h69RmIod/LoS9eY/oPPNA1MTe7Gf3tuzUt6Wq8RC3Jb4atxW/VY9sMS7Yan2qjEL3rNX9Cav6oBcA1vJbihBR9xhPQhYp
#sWX4wyrG2TQd6VsLsFwdnEtuVYwmYYfwwSo/qJ8n0MlOOwHZ/tI6GFrna3B8iKVZKjV3PlBscaYfJFBYZe1rOHZR1mrwqjJbE207
#j/Xao7UuNWvnOHt98nrRzvkIe9BwaGPItQtGl2BhH1I6RlIlRyunx/ApSvSs7Xza1rd20Xi7BsVLG8gu9P36i2aou7xU+govslq3
#RZoKnw9WKaYqMWrmN6dWcQfPLRizBl/VyZE+eIXdp+hmMs/SEouQ7IUiJINZ6f3Bg6DoO42con5IjqqVg1YI/KmmPFXMqPQoy5iZ
#sjUZFRvXMTF9ZIaSQZs4a5k4j5FLlbG3r2GOUwo2lt0E42XjFthWb2W5y0KP5b8Uk6goCe3rbsTESq3o1wRrouNmkYWUeJfWNAFV
#Wfg8y2L1W1l3E5kU4C9mB+0f0ar59krp3kLsAb9/qAsjkqG1lfwWUUSaGk6k1lQdGNeaHxoTm43D+Bf2EgZ9YxXw6prfca2xx77p
#9izUcpzy0PYtxnxaxpGCWbCM5056K3IahjY7EfqXr/C8BOPiXBgbb1mDZplSEoIX9LXAunQG2ZC9kl+jZFUygKLltYqYXSuGrn8A
#UEsDBBQAAAAIAAAAIVDhhuazLwAAADMAAAAMAAAAcHJvamVjdC5qc29uq+ZSUFAqqSxIVbJSUEpMScnPU9IBCeUl5oKFHH38FILz
#S3N8EvNKUovylLhquQBQSwMEFAAAAAgAAAAhUED3b2E0AQAATAIAABsAAAByZXNvdXJjZV9wYWNrL21hbmlmZXN0Lmpzb259kc1q
#wzAQhO9+CqFTC5GRf2KX3lroLfSSYylmJa0aQywZWQoNIe9exbETl0Iv0u6iGeZbnRJCqLauA98c0A2tNfSZ5KvLeIeg0MX2FLvY
#G+gwdvRl8062Nuw3YDw6Qx4OWcpT/khX13cKB+na3l+96FvX+yMBo0YRe7UhlvtJ6/HbB4dDSsSRROOtD6q1w2wVQqsuHnVVlWVW
#FEzXuGalyAoGYi2Z5ELkCKLgopo1d4yPcUBItpoKfivG+3NSdK1p0Hy1Bpt/xHk1V9Ukj+d53FRnVdjjcFOdpofUH/txZZHQBidx
#Bluggda14pViwIuSlagzBoXmTFcyF6Ws4Slf31V/8y0SLgBnxGvKmDOZcGmHHhR4uP8rBL+zblh40sVP/NpU7yKp9M3MBUrFMJc9
#JOfkB1BLAwQUAAAACAAAACFQ05V5H3QAAAAgAQAAKAAAAHJlc291cmNlX3BhY2svdGV4dHVyZXMvaXRlbV90ZXh0dXJlLmpzb26d
#jTEKgDAMRfeeonQW3b1MCDaCGKu0KQji3W2VIqKTQyD8vP+yKa2NpzBH3xEs2I3gcCLTaoPsIOUMjE7IO1NlVmiV6OmmhDHUg9AU
#noBFwQRsKdMfsnK5GyHryt6cxuZVOzt79S2FfmAm+9Nd2tcLlWdXB1BLAwQUAAAACAAAACFQqX9bda4AAACtAAAAMQAAAHJlc291
#cmNlX3BhY2svdGV4dHVyZXMvaXRlbXMvYWxuX3NvdWxfbGFudGVybi5wbmfrDPBz5+WS4mJgYOD19HAJAtICIMzBBiTlP/9PBFIl
#ni6OIRW3khMOME6ZuvW/cjJbEINH8/RwixjhDt9JijdEhHMZdl32/MZ15ucNg4tsc2o+/uQx89nE2L///3/+QymSDJd2vDv5/7/I
#boYUjjOiKa2MkXEziv+IuTk0HfEwYrgrMIlngYbsAZ6Vq145HUxJ1dhUrKzJwMD37IOvwH/rFUD7GTxd/VzWOSU0AQBQSwMEFAAA
#AAgAAAAhUP3Y77i6AAAAuwAAADgAAAByZXNvdXJjZV9wYWNrL3RleHR1cmVzL2l0ZW1zL2Fsbl9zb3VsX2xhbnRlcm5fZmlsbGVk
#LnBuZ+sM8HPn5ZLiYmBg4PX0cAkC0gIgzMEGJOU//08EUk2eLo4hFbeSEw4wTpm69b9yMlsQg0fz9HCLGOEO30mKN0SEcxl2Xfb8
#xnXm5w2Di2xX6ivYjq//9799s6eRw6dnjf9v/rdvMASqZDwxy1Hvwbt85m7BXAYf5k3cDkkqlYw3BSbtZeBmnqBo0OxhxiD2K0XS
#IdCqQTIo9Gpr08lTASnP3YCOuvzyTiHDTocNQNcweLr6uaxzSmgCAFBLAwQUAAAACAAAACFQvZZa2KEBAABzHwAAIQAAAHRleHR1
#cmVfc291cmNlcy9zb3VsX2xhbnRlcm4uanNvbu1X246CMBB95ysI++oD5dbir2w2psI0Iam4EUzMGv99S71AN2G3EXQpFhLtOTMt
#cxwLnKPjul4Nh3q/g8pbuu8Cu+5RfopISTcgWI/yclVt93zFaVnDrvQW14yq+GoyUHJj2JbnsGtmFTVsqjb1k3Ko6yb7ur4g/Sbx
#zb8ct2QRQTIShOJcd/lA8hGNaIy7fCh5TDEltMtHks9SICzMsm4klpE0y3CuzEgkDyHDjHV5LHkKEAn+Qp9aecUBePsbNkc7cl1/
#MSZAd4DhFdzGH4vHaFTqDfTmBOMKfq7Gf1ngIRrRk8BkNAajgmlqjEYFpmlMeoHRGhUl+NX6iPWaavR+NPq/Gg+9zcSGaYznqXGm
#z8d+weEdwID31VfwHRMArUan+33xl3868hUrOIfcJGNOJI/SPM2U9VPJJ2vGmHrdc0lARUDx5ehckb8mjCRK4FySsPE+JNaxW8du
#Hbt17PN27CjQRr52pgFKSRekvYCYplJT149m9i8x0V6iwb1Exu1NTc1kRhsT6XbdPJ2/3k7NFmqdvHXy1skPdvJOMzo531BLAQIU
#AxQAAAAIAAAAIVAznxnqZgEAADcCAAAMAAAAAAAAAAAAAACkAQAAAABDSEFOR0VMT0cubWRQSwECFAMUAAAACAAAACFQYt+Q5CUH
#AAAUEQAADgAAAAAAAAAAAAAApAGQAQAAREVTQ1JJUFRJT04ubWRQSwECFAMUAAAACAAAACFQJySLxqkBAAAEAwAACQAAAAAAAAAA
#AAAApAHhCAAAUkVBRE1FLm1kUEsBAhQDFAAAAAgAAAAhUOhoIlMKAQAASgIAACUAAAAAAAAAAAAAAKQBsQoAAGJlaGF2aW9yX3Bh
#Y2svaXRlbXMvc291bF9sYW50ZXJuLmpzb25QSwECFAMUAAAACAAAACFQCrhgvgkBAAAqAgAALAAAAAAAAAAAAAAApAH+CwAAYmVo
#YXZpb3JfcGFjay9pdGVtcy9zb3VsX2xhbnRlcm5fZmlsbGVkLmpzb25QSwECFAMUAAAACAAAACFQ5Ax2T8QBAABnBAAAGwAAAAAA
#AAAAAAAApAFRDQAAYmVoYXZpb3JfcGFjay9tYW5pZmVzdC5qc29uUEsBAhQDFAAAAAgAAAAhUGv8FUYPAQAAlAIAACwAAAAAAAAA
#AAAAAKQBTg8AAGJlaGF2aW9yX3BhY2svcmVjaXBlcy9zb3VsX2xhbnRlcm5fc2FuZC5qc29uUEsBAhQDFAAAAAgAAAAhUIryTtYP
#AQAAlAIAACwAAAAAAAAAAAAAAKQBpxAAAGJlaGF2aW9yX3BhY2svcmVjaXBlcy9zb3VsX2xhbnRlcm5fc29pbC5qc29uUEsBAhQD
#FAAAAAgAAAAhUJdUdt9fAwAALQcAACMAAAAAAAAAAAAAAKQBABIAAGJlaGF2aW9yX3BhY2svc2NyaXB0cy9saWIvUkVBRE1FLm1k
#UEsBAhQDFAAAAAgAAAAhUN8hsTf9EQAAcj0AAB0AAAAAAAAAAAAAAKQBoBUAAGJlaGF2aW9yX3BhY2svc2NyaXB0cy9tYWluLmpz
#UEsBAhQDFAAAAAgAAAAhUOGG5rMvAAAAMwAAAAwAAAAAAAAAAAAAAKQB2CcAAHByb2plY3QuanNvblBLAQIUAxQAAAAIAAAAIVBA
#929hNAEAAEwCAAAbAAAAAAAAAAAAAACkATEoAAByZXNvdXJjZV9wYWNrL21hbmlmZXN0Lmpzb25QSwECFAMUAAAACAAAACFQ05V5
#H3QAAAAgAQAAKAAAAAAAAAAAAAAApAGeKQAAcmVzb3VyY2VfcGFjay90ZXh0dXJlcy9pdGVtX3RleHR1cmUuanNvblBLAQIUAxQA
#AAAIAAAAIVCpf1t1rgAAAK0AAAAxAAAAAAAAAAAAAACkAVgqAAByZXNvdXJjZV9wYWNrL3RleHR1cmVzL2l0ZW1zL2Fsbl9zb3Vs
#X2xhbnRlcm4ucG5nUEsBAhQDFAAAAAgAAAAhUP3Y77i6AAAAuwAAADgAAAAAAAAAAAAAAKQBVSsAAHJlc291cmNlX3BhY2svdGV4
#dHVyZXMvaXRlbXMvYWxuX3NvdWxfbGFudGVybl9maWxsZWQucG5nUEsBAhQDFAAAAAgAAAAhUL2WWtihAQAAcx8AACEAAAAAAAAA
#AAAAAKQBZSwAAHRleHR1cmVfc291cmNlcy9zb3VsX2xhbnRlcm4uanNvblBLBQYAAAAAEAAQAOAEAABFLgAAAAA=
#--- ALN PAYLOAD END ---
