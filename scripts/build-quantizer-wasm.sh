#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CRATE_DIR="$ROOT_DIR/crates/quantizer-wasm"
OUT_DIR="$ROOT_DIR/src/lib/wasm"
OUT_FILE="$OUT_DIR/quantizer_wasm.wasm"

cargo build \
  --manifest-path "$CRATE_DIR/Cargo.toml" \
  --target wasm32-unknown-unknown \
  --release

mkdir -p "$OUT_DIR"
cp \
  "$CRATE_DIR/target/wasm32-unknown-unknown/release/quantizer_wasm.wasm" \
  "$OUT_FILE"

echo "Wrote $OUT_FILE"
