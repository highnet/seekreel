#!/bin/sh
# The only thing this film needs that is not checked in: the two typefaces.
# No animation library — every value on the stage is arithmetic on `t`.
set -e
D="$(cd "$(dirname "$0")" && pwd)"
sh "$D/fetch-fonts.sh"
echo
echo "Ready. From the repo root:"
echo "  seekreel build -c examples/instagram-promo/seekreel.config.json"
