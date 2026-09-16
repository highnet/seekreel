#!/bin/sh
# React, ReactDOM and htm as browser modules. No build step, no bundler.
set -e
D="$(cd "$(dirname "$0")" && pwd)"
sh "$D/fetch-react.sh"
echo
echo "Ready. From the repo root:"
echo "  seekreel build -c examples/react-stage/seekreel.config.json"
