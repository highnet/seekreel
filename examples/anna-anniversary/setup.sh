#!/bin/sh
# Everything the film needs that is fetched rather than vendored:
# three.js, Framer Motion (the `motion` package), Strudel and the font.
set -e
D="$(cd "$(dirname "$0")" && pwd)"
V=0.182.0
for F in three.module.js three.core.js; do
  curl -fsSL -o "$D/$F" "https://cdn.jsdelivr.net/npm/three@$V/build/$F"
done
curl -fsSL -o "$D/motion.js"   "https://cdn.jsdelivr.net/npm/motion@12.23.12/dist/motion.js"
curl -fsSL -o "$D/strudel.mjs" "https://cdn.jsdelivr.net/npm/@strudel/web@1.3.0/dist/index.mjs"
mkdir -p "$D/fonts"
curl -fsSL -o "$D/fonts/bricolage.ttf" \
  "https://raw.githubusercontent.com/google/fonts/main/ofl/bricolagegrotesque/BricolageGrotesque%5Bopsz%2Cwdth%2Cwght%5D.ttf"
echo
echo "Ready. From the repo root:"
echo "  seekreel build -c examples/anna-anniversary/seekreel.config.json"
