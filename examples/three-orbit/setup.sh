#!/bin/sh
# three.js, fetched. Nothing else: the scene is one file.
set -e
D="$(cd "$(dirname "$0")" && pwd)"
sh "$D/fetch-three.sh"
echo
echo "Ready. From the repo root:"
echo "  seekreel build -c examples/three-orbit/seekreel.config.json"
