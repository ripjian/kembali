#!/bin/sh
# Copy the shared kit into each reel so every composition is self-contained.
K="$(cd "$(dirname "$0")" && pwd)"
for v in v1 v2 v3 v2a v2b v2c; do
  [ -d "$K/$v" ] || continue
  mkdir -p "$K/$v/assets"
  cp -R "$K/kit/assets/." "$K/$v/assets/"
  cp "$K/kit/package.json" "$K/kit/hyperframes.json" "$K/$v/"
done
