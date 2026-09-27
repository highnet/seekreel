#!/bin/sh
# The seekreel family pack's browser dependencies, fetched into family/vendor:
# three.js, Motion (Framer Motion's engine), React + ReactDOM + htm as browser
# modules, Strudel for the soundtrack, and the Bricolage Grotesque font.
set -e
D="$(cd "$(dirname "$0")" && pwd)/vendor"
mkdir -p "$D"

THREE=0.182.0
for F in three.module.js three.core.js; do
  curl -fsSL -o "$D/$F" "https://cdn.jsdelivr.net/npm/three@$THREE/build/$F"
done
curl -fsSL -o "$D/motion.js" "https://cdn.jsdelivr.net/npm/motion@12.23.12/dist/motion.js"

# React as browser ES modules from esm.sh; each bundle imports React by URL,
# so point those imports at the local copy and the render never needs network.
REACT=19.2.0
HTM=3.1.1
curl -fsSL -o "$D/react.js"            "https://esm.sh/react@$REACT/es2022/react.mjs"
curl -fsSL -o "$D/react-dom.js"        "https://esm.sh/react-dom@$REACT/es2022/react-dom.bundle.mjs"
curl -fsSL -o "$D/react-dom-client.js" "https://esm.sh/react-dom@$REACT/es2022/client.bundle.mjs"
curl -fsSL -o "$D/htm.js"              "https://esm.sh/htm@$HTM/es2022/react.bundle.mjs"
for F in "$D/react-dom.js" "$D/react-dom-client.js" "$D/htm.js"; do
  sed -i.bak \
    -e 's|"/react@[^"]*"|"./react.js"|g' \
    -e 's|"/react?[^"]*"|"./react.js"|g' \
    -e 's|"https://esm.sh/react@[^"]*"|"./react.js"|g' "$F"
  rm -f "$F.bak"
done

curl -fsSL -o "$D/strudel.mjs" "https://cdn.jsdelivr.net/npm/@strudel/web@1.3.0/dist/index.mjs"
curl -fsSL -o "$D/bricolage.ttf" \
  "https://raw.githubusercontent.com/google/fonts/main/ofl/bricolagegrotesque/BricolageGrotesque%5Bopsz%2Cwdth%2Cwght%5D.ttf"

echo "family pack ready in $(dirname "$D"). From the repo root:"
echo "  seekreel build -c family/movie.config.json     # the sample movie"
echo "  seekreel build -c family/picnic.config.json    # or one scene"
