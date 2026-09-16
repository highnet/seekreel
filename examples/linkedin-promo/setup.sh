#!/bin/sh
# Everything this film needs that is not checked in: the two typefaces, the
# Strudel bundle the soundtrack is rendered from, and three.js for the one shot
# that is a real 3D scene rather than a picture of one.
set -e
D="$(cd "$(dirname "$0")" && pwd)"

sh "$D/fetch-fonts.sh"

# The pinned Strudel version lives in the CLI, so there is one place to bump it.
node "$D/../../bin/seekreel.ts" strudel -c "$D/seekreel.config.json"

# The same three.js the three-orbit example uses; its script writes into its own
# directory, so this asks for the files directly.
THREE=0.182.0
for F in three.module.js three.core.js; do
  curl -fsSL -o "$D/$F" "https://cdn.jsdelivr.net/npm/three@$THREE/build/$F"
done
echo "three $THREE in $D"

echo
echo "Ready. From the repo root:"
echo "  seekreel build -c examples/linkedin-promo/seekreel.config.json"
