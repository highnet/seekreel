#!/bin/sh
# three.js, fetched rather than vendored. It ships as an ES module, which is why
# seekreel serves a stage over loopback instead of opening it from disk.
set -e
D="$(cd "$(dirname "$0")" && pwd)"
# Two files: the module build imports its own core, so fetching one is not
# enough and the miss only shows up as a 404 at render time.
V=0.182.0
for F in three.module.js three.core.js; do
  curl -fsSL -o "$D/$F" "https://cdn.jsdelivr.net/npm/three@$V/build/$F"
done
echo "three $V in $D"
