#!/bin/sh
# GSAP, pinned. The film is a paused timeline seeked one frame at a time, so
# the exact version matters: an easing curve that changed would change frames.
set -e
D="$(cd "$(dirname "$0")" && pwd)"
curl -fsSL -o "$D/gsap.min.js" "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"
echo "gsap 3.12.5 -> $D/gsap.min.js"
