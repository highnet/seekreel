#!/bin/sh
#
# seekreel installer.
#
#   curl -fsSL https://raw.githubusercontent.com/highnet/seekreel/main/install.sh | sh
#
# Clones the repository, installs the one runtime dependency, and links the CLI
# onto your PATH. There is no npm registry package and no build step: the tool
# is TypeScript, and Node runs it as it is.
#
# Environment:
#   SEEKREEL_HOME   where to clone (default ~/.seekreel)
#   SEEKREEL_BIN    where to link  (default ~/.local/bin)
#   SEEKREEL_REF    branch or tag  (default main)
set -eu

REPO="${SEEKREEL_REPO:-https://github.com/highnet/seekreel.git}"
HOME_DIR="${SEEKREEL_HOME:-$HOME/.seekreel}"
BIN_DIR="${SEEKREEL_BIN:-$HOME/.local/bin}"
REF="${SEEKREEL_REF:-main}"

say() { printf '%s\n' "$*"; }
die() { printf '\n%s\n\n' "$*" >&2; exit 1; }

command -v git >/dev/null 2>&1 || die "git is not installed. seekreel is distributed by git."
command -v node >/dev/null 2>&1 || die "node is not installed. seekreel needs Node 22.18 or newer."

# Node runs TypeScript directly from 22.18 onward. Older versions would need a
# build step this project deliberately does not have.
NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
NODE_MINOR=$(node -p 'process.versions.node.split(".")[1]')
if [ "$NODE_MAJOR" -lt 22 ] || { [ "$NODE_MAJOR" -eq 22 ] && [ "$NODE_MINOR" -lt 18 ]; }; then
  die "Node $(node -v) is too old. seekreel runs its TypeScript directly, which needs 22.18 or newer."
fi

if [ -d "$HOME_DIR/.git" ]; then
  say "Updating $HOME_DIR"
  git -C "$HOME_DIR" fetch --quiet origin "$REF"
  git -C "$HOME_DIR" checkout --quiet "$REF"
  git -C "$HOME_DIR" reset --hard --quiet "origin/$REF" 2>/dev/null || true
else
  say "Cloning into $HOME_DIR"
  git clone --quiet --depth 1 --branch "$REF" "$REPO" "$HOME_DIR"
fi

# playwright-core is the only runtime dependency, and it is a library rather
# than a browser: it drives the Chromium you already have.
say "Installing the runtime dependency"
if command -v pnpm >/dev/null 2>&1; then
  (cd "$HOME_DIR" && pnpm install --prod --silent)
elif command -v bun >/dev/null 2>&1; then
  (cd "$HOME_DIR" && bun install --production --silent)
elif command -v npm >/dev/null 2>&1; then
  (cd "$HOME_DIR" && npm install --omit=dev --silent)
else
  die "No package manager found (pnpm, bun or npm). seekreel needs playwright-core installed in $HOME_DIR."
fi

mkdir -p "$BIN_DIR"
ln -sf "$HOME_DIR/bin/seekreel.ts" "$BIN_DIR/seekreel"
chmod +x "$HOME_DIR/bin/seekreel.ts"

say ""
say "seekreel installed."
say "  source   $HOME_DIR"
say "  command  $BIN_DIR/seekreel"

case ":$PATH:" in
  *":$BIN_DIR:"*) ;;
  *) say ""; say "$BIN_DIR is not on your PATH. Add it:"; say "  export PATH=\"\$PATH:$BIN_DIR\"" ;;
esac

say ""
say "Check what it can find:"
say "  seekreel doctor"
