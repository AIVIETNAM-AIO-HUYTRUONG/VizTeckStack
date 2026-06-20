#!/bin/bash
set -e

PROTO_DIR="$(dirname "$0")"
OUT_DIR="$PROTO_DIR/generated"

mkdir -p "$OUT_DIR"

npx protoc \
  --plugin=protoc-gen-ts_proto="./node_modules/.bin/protoc-gen-ts_proto" \
  --ts_proto_out="$OUT_DIR" \
  --ts_proto_opt=nestJs=true \
  --ts_proto_opt=fileSuffix='' \
  --proto_path="$PROTO_DIR" \
  "$PROTO_DIR/roadmap.proto"

echo "Proto generation complete → $OUT_DIR"
