#!/bin/sh
# Archivo variable (the wdth axis is what sets the condensed slip caps) and
# Fira Mono, the two faces DESIGN.md names. Fetched rather than vendored.
set -e
D="$(cd "$(dirname "$0")" && pwd)/fonts"
mkdir -p "$D"
curl -fsSL -o "$D/archivo.ttf" \
  "https://raw.githubusercontent.com/google/fonts/main/ofl/archivo/Archivo%5Bwdth%2Cwght%5D.ttf"
curl -fsSL -o "$D/firamono.ttf" \
  "https://raw.githubusercontent.com/google/fonts/main/ofl/firamono/FiraMono-Regular.ttf"
echo "fonts in $D"
