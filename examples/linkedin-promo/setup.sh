#!/bin/sh
# The two things this film needs that are not checked in: the typefaces, and
# the Strudel bundle the soundtrack is rendered with. No animation library —
# every value on the stage is arithmetic on `t`.
set -e
D="$(cd "$(dirname "$0")" && pwd)"
sh "$D/fetch-fonts.sh"
# The pinned version lives in the CLI, so there is one place to bump it.
node "$D/../../bin/seekreel.js" strudel -c "$D/seekreel.config.json"
echo
echo "Ready. From the repo root:"
echo "  seekreel build -c examples/linkedin-promo/seekreel.config.json"
