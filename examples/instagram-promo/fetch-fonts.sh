#!/bin/sh
# The two faces site/DESIGN.md names: Anybody (variable, the wdth axis is what
# makes the wordmark run wide) and Martian Mono for every frame number and
# command. Fetched rather than vendored, same as the other example.
set -e
D="$(cd "$(dirname "$0")" && pwd)/fonts"
mkdir -p "$D"
curl -fsSL -o "$D/anybody.ttf" \
  "https://raw.githubusercontent.com/google/fonts/main/ofl/anybody/Anybody%5Bwdth%2Cwght%5D.ttf"
curl -fsSL -o "$D/martianmono.ttf" \
  "https://raw.githubusercontent.com/google/fonts/main/ofl/martianmono/MartianMono%5Bwdth%2Cwght%5D.ttf"
echo "fonts in $D"
