#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
  console.error('Usage: node ua-arch-analyze.js <input.json> <output.json>');
  process.exit(1);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
} catch (e) {
  console.error('Failed to read input:', e.message);
  process.exit(1);
}

const { fileNodes, importEdges, allEdges } = data;

// ─── A. Directory Grouping ───────────────────────────────────────────────────
function getGroup(filePath) {
  if (filePath.startsWith('apps/admin')) return 'apps/admin';
  if (filePath.startsWith('apps/api-gateway')) return 'apps/api-gateway';
  if (filePath.startsWith('apps/web')) return 'apps/web';
  if (filePath.startsWith('apps/e2e')) return 'apps/e2e';
  if (filePath.startsWith('packages/core')) return 'packages/core';
  if (filePath.startsWith('packages/db')) return 'packages/db';
  if (filePath.startsWith('packages/graph')) return 'packages/graph';
  if (filePath.startsWith('packages/lesson')) return 'packages/lesson';
  if (filePath.startsWith('packages/ui')) return 'packages/ui';
  if (filePath.startsWith('packages/graphql-client')) return 'packages/graphql-client';
  if (filePath.startsWith('.github')) return '.github';
  if (filePath.startsWith('docs/') || filePath === 'README.md' || filePath === 'CLAUDE.md') return 'docs';
  if (filePath.startsWith('services/')) return 'services';
  if (filePath.startsWith('.husky')) return '.husky';
  if (filePath.startsWith('.understand-anything')) return '.understand-anything';
  return 'root';
}

const directoryGroups = {};
fileNodes.forEach(n => {
  const g = getGroup(n.filePath);
  if (!directoryGroups[g]) directoryGroups[g] = [];
  directoryGroups[g].push(n.id);
});

// ─── B. Node Type Grouping ────────────────────────────────────────────────────
const nodeTypeGroups = {};
fileNodes.forEach(n => {
  if (!nodeTypeGroups[n.type]) nodeTypeGroups[n.type] = [];
  nodeTypeGroups[n.type].push(n.id);
});

// ─── C. Fan-in / Fan-out ─────────────────────────────────────────────────────
const fileFanOut = {};
const fileFanIn = {};
fileNodes.forEach(n => { fileFanOut[n.id] = 0; fileFanIn[n.id] = 0; });

importEdges.forEach(e => {
  if (fileFanOut[e.source] !== undefined) fileFanOut[e.source]++;
  if (fileFanIn[e.target] !== undefined) fileFanIn[e.target]++;
});

// ─── D. Cross-category edges ──────────────────────────────────────────────────
const nodeTypeMap = {};
fileNodes.forEach(n => { nodeTypeMap[n.id] = n.type; });

const crossCategoryEdgeMap = {};
allEdges.forEach(e => {
  const srcType = nodeTypeMap[e.source];
  const tgtType = nodeTypeMap[e.target];
  if (!srcType || !tgtType || srcType === tgtType) return;
  const key = `${srcType}->${tgtType}:${e.type}`;
  crossCategoryEdgeMap[key] = (crossCategoryEdgeMap[key] || 0) + 1;
});

const crossCategoryEdges = Object.entries(crossCategoryEdgeMap).map(([key, count]) => {
  const [pair, edgeType] = key.split(':');
  const [fromType, toType] = pair.split('->');
  return { fromType, toType, edgeType, count };
});

// ─── E. Inter-group imports ───────────────────────────────────────────────────
const nodeGroupMap = {};
fileNodes.forEach(n => { nodeGroupMap[n.id] = getGroup(n.filePath); });

const interGroupMap = {};
importEdges.forEach(e => {
  const sg = nodeGroupMap[e.source];
  const tg = nodeGroupMap[e.target];
  if (!sg || !tg || sg === tg) return;
  const key = `${sg}=>${tg}`;
  interGroupMap[key] = (interGroupMap[key] || 0) + 1;
});

const interGroupImports = Object.entries(interGroupMap).map(([key, count]) => {
  const [from, to] = key.split('=>');
  return { from, to, count };
}).sort((a, b) => b.count - a.count);

// ─── F. Intra-group density ───────────────────────────────────────────────────
const groupTotalEdges = {};
const groupInternalEdges = {};
Object.keys(directoryGroups).forEach(g => {
  groupTotalEdges[g] = 0;
  groupInternalEdges[g] = 0;
});

importEdges.forEach(e => {
  const sg = nodeGroupMap[e.source];
  const tg = nodeGroupMap[e.target];
  if (sg) groupTotalEdges[sg] = (groupTotalEdges[sg] || 0) + 1;
  if (tg && tg !== sg) groupTotalEdges[tg] = (groupTotalEdges[tg] || 0) + 1;
  if (sg && tg && sg === tg) groupInternalEdges[sg] = (groupInternalEdges[sg] || 0) + 1;
});

const intraGroupDensity = {};
Object.keys(directoryGroups).forEach(g => {
  const total = groupTotalEdges[g] || 0;
  const internal = groupInternalEdges[g] || 0;
  intraGroupDensity[g] = {
    internalEdges: internal,
    totalEdges: total,
    density: total > 0 ? parseFloat((internal / total).toFixed(3)) : 0
  };
});

// ─── G. Pattern matching ──────────────────────────────────────────────────────
const PATTERNS = {
  'apps/admin': 'ui',
  'apps/web': 'ui',
  'apps/api-gateway': 'api',
  'apps/e2e': 'test',
  'packages/core': 'service',
  'packages/db': 'data',
  'packages/graph': 'utility',
  'packages/lesson': 'utility',
  'packages/ui': 'ui',
  'packages/graphql-client': 'types',
  '.github': 'ci-cd',
  'docs': 'documentation',
  'services': 'infrastructure',
  '.husky': 'config',
  '.understand-anything': 'config',
  'root': 'config'
};

const patternMatches = {};
Object.keys(directoryGroups).forEach(g => {
  patternMatches[g] = PATTERNS[g] || 'utility';
});

// ─── H. Deployment topology ───────────────────────────────────────────────────
const infraFiles = fileNodes
  .filter(n => /dockerfile|docker-compose|\.tf$|render\.yaml|k8s/i.test(n.filePath))
  .map(n => n.filePath);

const deploymentTopology = {
  hasDockerfile: fileNodes.some(n => /dockerfile/i.test(n.filePath)),
  hasCompose: fileNodes.some(n => /docker-compose/i.test(n.filePath)),
  hasK8s: fileNodes.some(n => /k8s|kubernetes|helm/i.test(n.filePath)),
  hasTerraform: fileNodes.some(n => /\.tf$/i.test(n.filePath)),
  hasCI: fileNodes.some(n => n.filePath.startsWith('.github/workflows')),
  infraFiles
};

// ─── I. Data pipeline ─────────────────────────────────────────────────────────
const dataPipeline = {
  schemaFiles: fileNodes.filter(n => /\.sql$|\.graphql$|\.gql$|\.proto$|schema/i.test(n.filePath)).map(n => n.filePath),
  migrationFiles: fileNodes.filter(n => /migration/i.test(n.filePath)).map(n => n.filePath),
  dataModelFiles: fileNodes.filter(n => /model|entity|prisma/i.test(n.filePath)).map(n => n.filePath),
  apiHandlerFiles: fileNodes.filter(n => /controller|route|resolver/i.test(n.filePath)).map(n => n.filePath)
};

// ─── J. Doc coverage ─────────────────────────────────────────────────────────
const groupsWithDocs = Object.keys(directoryGroups).filter(g =>
  directoryGroups[g].some(id => {
    const node = fileNodes.find(n => n.id === id);
    return node && (node.type === 'document' || /\.md$|\.rst$/i.test(node.filePath));
  })
);
const docCoverage = {
  groupsWithDocs: groupsWithDocs.length,
  totalGroups: Object.keys(directoryGroups).length,
  coverageRatio: parseFloat((groupsWithDocs.length / Object.keys(directoryGroups).length).toFixed(2)),
  undocumentedGroups: Object.keys(directoryGroups).filter(g => !groupsWithDocs.includes(g))
};

// ─── K. Dependency direction ──────────────────────────────────────────────────
const pairImports = {};
interGroupImports.forEach(({ from, to, count }) => {
  const key = [from, to].sort().join('|');
  if (!pairImports[key]) pairImports[key] = { a: from, b: to, ab: 0, ba: 0 };
  if (pairImports[key].a === from) pairImports[key].ab += count;
  else pairImports[key].ba += count;
});

const dependencyDirection = [];
Object.values(pairImports).forEach(({ a, b, ab, ba }) => {
  if (ab !== ba) {
    const dependent = ab > ba ? a : b;
    const dependsOn = ab > ba ? b : a;
    dependencyDirection.push({ dependent, dependsOn });
  }
});

// ─── Stats ────────────────────────────────────────────────────────────────────
const filesPerGroup = {};
Object.keys(directoryGroups).forEach(g => { filesPerGroup[g] = directoryGroups[g].length; });
const nodeTypeCounts = {};
fileNodes.forEach(n => { nodeTypeCounts[n.type] = (nodeTypeCounts[n.type] || 0) + 1; });

const result = {
  scriptCompleted: true,
  directoryGroups,
  nodeTypeGroups,
  crossCategoryEdges,
  interGroupImports,
  intraGroupDensity,
  patternMatches,
  deploymentTopology,
  dataPipeline,
  docCoverage,
  dependencyDirection,
  fileStats: {
    totalFileNodes: fileNodes.length,
    filesPerGroup,
    nodeTypeCounts
  },
  fileFanIn,
  fileFanOut
};

try {
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log('Done. Total nodes:', fileNodes.length);
} catch (e) {
  console.error('Failed to write output:', e.message);
  process.exit(1);
}
