#!/bin/sh
# Everything the stage needs that is not checked in: the two typefaces, the
# animation library, and the noise plate the "photograph" is grained with.
set -e
D="$(cd "$(dirname "$0")" && pwd)"
sh "$D/fetch-fonts.sh"
sh "$D/fetch-gsap.sh"
python3 "$D/make-grain.py"
echo
echo "Ready. From the repo root:"
echo "  seekreel build -c examples/collection-dex/seekreel.config.json"
