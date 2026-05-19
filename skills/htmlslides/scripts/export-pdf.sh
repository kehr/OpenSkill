#!/usr/bin/env bash
# export-pdf.sh -- thin bash wrapper that probes for a system Chrome / Chromium
# and invokes export-pdf.mjs in an isolated tmp directory.
#
# Usage:
#   bash export-pdf.sh <input.html> [<output.pdf>] [--compact]
#
# Exit codes:
#   0  success
#   1  bad arguments
#   2  no Chrome found in any probe path
#   3  npm install or node script failed
#   4  output verification failed (file missing or too small)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log() { printf '[export-pdf] %s\n' "$*" >&2; }
die() { printf '[export-pdf] ERROR: %s\n' "$*" >&2; exit "${2:-1}"; }

# ---------- Argument parsing ----------

if [ $# -lt 1 ]; then
  cat >&2 <<'USAGE'
usage: export-pdf.sh <input.html> [<output.pdf>] [--compact]

  input.html   path to the HTML deck (required)
  output.pdf   destination PDF path (default: <input>.pdf next to input)
  --compact    render at 1280x720 instead of 1920x1080
USAGE
  exit 1
fi

INPUT_HTML=""
OUTPUT_PDF=""
COMPACT_FLAG=""

while [ $# -gt 0 ]; do
  case "$1" in
    --compact) COMPACT_FLAG="--compact"; shift ;;
    -h|--help)
      sed -n '1,20p' "$0" >&2
      exit 0
      ;;
    *)
      if [ -z "$INPUT_HTML" ]; then
        INPUT_HTML="$1"
      elif [ -z "$OUTPUT_PDF" ]; then
        OUTPUT_PDF="$1"
      else
        die "unexpected argument: $1" 1
      fi
      shift
      ;;
  esac
done

[ -z "$INPUT_HTML" ] && die "input HTML path required" 1
[ -f "$INPUT_HTML" ] || die "input HTML not found: $INPUT_HTML" 1

# Resolve absolute paths
INPUT_HTML="$(cd "$(dirname "$INPUT_HTML")" && pwd)/$(basename "$INPUT_HTML")"

if [ -z "$OUTPUT_PDF" ]; then
  OUTPUT_PDF="${INPUT_HTML%.html}.pdf"
fi
# Make OUTPUT_PDF absolute too (do not require it to exist yet)
OUTPUT_DIR="$(cd "$(dirname "$OUTPUT_PDF")" 2>/dev/null && pwd || true)"
if [ -z "$OUTPUT_DIR" ]; then
  die "output directory does not exist: $(dirname "$OUTPUT_PDF")" 1
fi
OUTPUT_PDF="$OUTPUT_DIR/$(basename "$OUTPUT_PDF")"

# ---------- Chrome probe ----------

OS="$(uname -s)"
case "$OS" in
  Darwin) PLATFORM="darwin" ;;
  Linux)  PLATFORM="linux"  ;;
  MINGW*|MSYS*|CYGWIN*) PLATFORM="win32" ;;
  *) die "unsupported platform: $OS" 1 ;;
esac

declare -a CHROME_CANDIDATES
case "$PLATFORM" in
  darwin)
    CHROME_CANDIDATES=(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary"
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
      "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
      "/Applications/Chromium.app/Contents/MacOS/Chromium"
    )
    ;;
  linux)
    CHROME_CANDIDATES=(
      "/usr/bin/google-chrome"
      "/usr/bin/google-chrome-stable"
      "/usr/bin/chromium"
      "/usr/bin/chromium-browser"
      "/snap/bin/chromium"
    )
    ;;
  win32)
    CHROME_CANDIDATES=(
      "/c/Program Files/Google/Chrome/Application/chrome.exe"
      "/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"
      "$LOCALAPPDATA/Google/Chrome/Application/chrome.exe"
    )
    ;;
esac

CHROME_PATH=""
for candidate in "${CHROME_CANDIDATES[@]}"; do
  if [ -x "$candidate" ]; then
    CHROME_PATH="$candidate"
    break
  fi
done

if [ -z "$CHROME_PATH" ]; then
  cat >&2 <<EOF
[export-pdf] Chrome not found in any probe path.
Recovery options:
  (1) Install Chrome (or compatible Chromium-based browser):
        macOS:           brew install --cask google-chrome
        Debian/Ubuntu:   sudo apt install google-chrome-stable
        Windows:         https://www.google.com/chrome

  (2) Skip this script entirely. Open the HTML in any browser and use
        Cmd+P (macOS) / Ctrl+P (Linux/Windows)  ->  Save as PDF.
EOF
  exit 2
fi

log "Using Chrome: $CHROME_PATH"

# ---------- Node + npm sanity check ----------

command -v node >/dev/null 2>&1 || die "node is required (>=18). Install from https://nodejs.org/" 3
command -v npm  >/dev/null 2>&1 || die "npm is required. Comes bundled with node." 3

NODE_MAJOR="$(node -e 'console.log(process.versions.node.split(".")[0])')"
if [ "$NODE_MAJOR" -lt 18 ]; then
  die "node >= 18 required (you have $(node -v))" 3
fi

# ---------- Isolated tmp dir with puppeteer-core ----------

WORK_DIR="$(mktemp -d -t htmlslides-pdf-XXXXXX)"
log "Workdir: $WORK_DIR"

cleanup() {
  if [ -n "${WORK_DIR:-}" ] && [ -d "$WORK_DIR" ]; then
    rm -rf "$WORK_DIR"
  fi
}
trap cleanup EXIT

cat > "$WORK_DIR/package.json" <<'PKG'
{
  "name": "htmlslides-pdf-runtime",
  "private": true,
  "type": "module",
  "version": "0.0.0"
}
PKG

log "Installing puppeteer-core into workdir (one-time, ~3MB)..."
(
  cd "$WORK_DIR"
  if ! npm install puppeteer-core@^24 --no-audit --no-fund --silent >/dev/null 2>"$WORK_DIR/npm-err.log"; then
    cat "$WORK_DIR/npm-err.log" >&2
    die "npm install puppeteer-core failed" 3
  fi
)

# ---------- Invoke the worker ----------

cp "$SCRIPT_DIR/export-pdf.mjs" "$WORK_DIR/export-pdf.mjs"

if ! node "$WORK_DIR/export-pdf.mjs" \
    --input "$INPUT_HTML" \
    --output "$OUTPUT_PDF" \
    --chrome "$CHROME_PATH" \
    $COMPACT_FLAG; then
  die "export-pdf.mjs failed" 3
fi

# ---------- Output verification ----------

if [ ! -f "$OUTPUT_PDF" ]; then
  die "expected output PDF was not created: $OUTPUT_PDF" 4
fi

SIZE="$(wc -c < "$OUTPUT_PDF" | tr -d ' ')"
if [ "$SIZE" -lt 51200 ]; then
  log "WARNING: output PDF is only ${SIZE} bytes (< 50KB threshold)."
  log "         Screenshots may have failed. Inspect $OUTPUT_PDF manually."
fi

log "Wrote $OUTPUT_PDF (${SIZE} bytes)"
printf '%s\n' "$OUTPUT_PDF"
