#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const protoDir = __dirname;
const outDir = path.join(protoDir, 'generated');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const isWindows = process.platform === 'win32';
const pluginExt = isWindows ? '.CMD' : '';
const plugin = path.join(protoDir, 'node_modules', '.bin', `protoc-gen-ts_proto${pluginExt}`);

const cmd = [
  'protoc',
  `--plugin=protoc-gen-ts_proto="${plugin}"`,
  `--ts_proto_out="${outDir}"`,
  '--ts_proto_opt=nestJs=true',
  `--proto_path="${protoDir}"`,
  `"${path.join(protoDir, 'roadmap.proto')}"`,
].join(' ');

execSync(cmd, { stdio: 'inherit', cwd: protoDir });
console.log(`Proto generation complete → ${outDir}`);
