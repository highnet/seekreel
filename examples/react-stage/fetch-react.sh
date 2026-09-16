#!/bin/sh
# React, ReactDOM and htm as browser ES modules, vendored into this example.
#
# esm.sh serves the same packages npm does, already bundled for a browser, which
# is what lets this example have no build step at all. Each bundle imports React
# from an absolute esm.sh path; the sed below points those at the local copy, so
# the rendered page never touches the network.
#
# A project with a bundler needs none of this: point `stage` at the HTML your
# build writes and the contract is identical.
set -e
D="$(cd "$(dirname "$0")" && pwd)/vendor"
mkdir -p "$D"

REACT=19.2.0
HTM=3.1.1
BASE="https://esm.sh"

curl -fsSL -o "$D/react.js"            "$BASE/react@$REACT/es2022/react.mjs"
curl -fsSL -o "$D/react-dom.js"        "$BASE/react-dom@$REACT/es2022/react-dom.bundle.mjs"
curl -fsSL -o "$D/react-dom-client.js" "$BASE/react-dom@$REACT/es2022/client.bundle.mjs"
curl -fsSL -o "$D/htm.js"              "$BASE/htm@$HTM/es2022/react.bundle.mjs"

# Every bundle imports React by URL. Make those local.
for F in "$D/react-dom.js" "$D/react-dom-client.js" "$D/htm.js"; do
  sed -i.bak \
    -e 's|"/react@[^"]*"|"./react.js"|g' \
    -e 's|"/react?[^"]*"|"./react.js"|g' \
    -e 's|"https://esm.sh/react@[^"]*"|"./react.js"|g' "$F"
  rm -f "$F.bak"
done

echo "react $REACT and htm $HTM in $D"
