#!/usr/bin/env bash
# Rebuilds public/img and public/tex from the reference boards in references/.
# The boards are 1080x1920 storyboard cards; the photographs are cropped out of them.
set -euo pipefail
cd "$(dirname "$0")/.."
R=references
O=public/img
mkdir -p "$O" public/tex
MAIN="crop=920:918:80:330"
SUB_L="crop=441:339:80:1306"
crop() { ffmpeg -v error -y -i "$R/$1" -vf "$2" "$O/$3"; }
crop scene06-golden-hour.webp "$MAIN" golden_main.png
crop scene06-golden-hour.webp "$SUB_L" golden_water.png
crop scene04-paper-bridge.webp "$MAIN" paper_main.png
crop scene02-archival.webp "$MAIN" archive_main.png
crop scene02-archival.webp "$SUB_L" archive_bridge.png
ffmpeg -v error -y -i "$R/scene01-parchment-world.webp" "$O/parchment_world.png"
python3 scripts/extend.py "$O/paper_main.png" "$O/paper_ext.png" 760
python3 scripts/textures.py public/tex
python3 scripts/score.py public/score.wav
