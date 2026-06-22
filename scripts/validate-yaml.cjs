const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = path.join(__dirname, '..');

const targets = [
  ...(fs.existsSync(path.join(ROOT, '.github', 'workflows'))
    ? fs.readdirSync(path.join(ROOT, '.github', 'workflows'))
        .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
        .map((f) => path.join('.github', 'workflows', f))
    : []),
  'docker-compose.yml',
  'pnpm-workspace.yaml',
].filter((f) => fs.existsSync(path.join(ROOT, f)));

let errors = 0;
for (const rel of targets) {
  try {
    yaml.load(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
    console.log(`  ✓ ${rel}`);
  } catch (e) {
    console.error(`  ✗ ${rel}: ${e.message}`);
    errors++;
  }
}

if (errors > 0) {
  console.error(`\n${errors} file(s) failed YAML validation`);
  process.exit(1);
}
