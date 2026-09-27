#!/bin/sh
# The actors kit's browser dependencies, fetched rather than vendored:
# three.js, Motion (Framer Motion's engine) and the Bricolage Grotesque font.
set -e
D="$(cd "$(dirname "$0")" && pwd)/vendor"
mkdir -p "$D"
V=0.182.0
for F in three.module.js three.core.js; do
  curl -fsSL -o "$D/$F" "https://cdn.jsdelivr.net/npm/three@$V/build/$F"
done
curl -fsSL -o "$D/motion.js" "https://cdn.jsdelivr.net/npm/motion@12.23.12/dist/motion.js"
curl -fsSL -o "$D/bricolage.ttf" \
  "https://raw.githubusercontent.com/google/fonts/main/ofl/bricolagegrotesque/BricolageGrotesque%5Bopsz%2Cwdth%2Cwght%5D.ttf"
echo "actors kit ready in $(dirname "$D"). Render a sample:"
echo "  seekreel build -c actors/picnic.config.json"
