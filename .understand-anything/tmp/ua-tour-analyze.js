#!/usr/bin/env node
'use strict';
const fs = require('fs');

const inputPath = process.argv[2];
const outputPath = process.argv[3];
if (!inputPath || !outputPath) { console.error('Usage: node ua-tour-analyze.js <input> <output>'); process.exit(1); }

let raw = fs.readFileSync(inputPath, 'utf8');
if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1); // strip BOM
const data = JSON.parse(raw);
const { nodes, edges, layers } = data;

// Filter to file-level nodes only (exclude function/class nodes)
const fileNodes = nodes.filter(n => !n.id.startsWith('function:') && !n.id.startsWith('class:'));
const nodeIds = new Set(fileNodes.map(n => n.id));

// Only consider edges between file-level nodes
const fileEdges = edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));

// A. Fan-in ranking
const fanIn = {};
const fanOut = {};
for (const n of fileNodes) { fanIn[n.id] = 0; fanOut[n.id] = 0; }
for (const e of fileEdges) {
  if (fanIn[e.target] !== undefined) fanIn[e.target]++;
  if (fanOut[e.source] !== undefined) fanOut[e.source]++;
}
const fanInRanking = fileNodes
  .map(n => ({ id: n.id, name: n.name, fanIn: fanIn[n.id] || 0 }))
  .sort((a, b) => b.fanIn - a.fanIn).slice(0, 20);

const fanOutRanking = fileNodes
  .map(n => ({ id: n.id, name: n.name, fanOut: fanOut[n.id] || 0 }))
  .sort((a, b) => b.fanOut - a.fanOut).slice(0, 20);

// B. Entry point candidates
const totalNodes = fileNodes.length;
const fanOutValues = fileNodes.map(n => fanOut[n.id] || 0).sort((a,b) => a-b);
const top10pct = fanOutValues[Math.floor(totalNodes * 0.9)];
const bottom25pct = fanInValues => fanInValues[Math.floor(totalNodes * 0.25)];
const fanInValues = fileNodes.map(n => fanIn[n.id] || 0).sort((a,b) => a-b);
const fanInBottom25 = fanInValues[Math.floor(totalNodes * 0.25)];

const entryPatterns = [
  'index.ts','index.js','main.ts','main.js','app.ts','app.js',
  'server.ts','server.js','mod.rs','main.go','main.py','main.rs',
  'manage.py','app.py','wsgi.py','asgi.py','run.py','__main__.py',
  'Application.java','Main.java','Program.cs','config.ru','index.php',
  'App.swift','Application.kt','main.cpp','main.c'
];

function scoreNode(n) {
  let score = 0;
  const type = n.type;
  const name = n.name;
  const fp = n.filePath || '';

  if (type === 'document') {
    if (name === 'README.md' && !fp.includes('/')) score += 5;
    else if (name.endsWith('.md') && !fp.includes('/')) score += 2;
    return { id: n.id, score, name, summary: n.summary };
  }

  if (entryPatterns.includes(name)) score += 3;
  // depth check
  const parts = fp.split('/').filter(Boolean);
  if (parts.length <= 2) score += 1;
  if ((fanOut[n.id] || 0) >= top10pct) score += 1;
  if ((fanIn[n.id] || 0) <= fanInBottom25) score += 1;
  return { id: n.id, score, name, summary: n.summary };
}

const entryPointCandidates = fileNodes
  .map(scoreNode)
  .sort((a, b) => b.score - a.score)
  .slice(0, 5);

// C. BFS from top code entry point (skip docs)
const topCodeEntry = entryPointCandidates.find(e => {
  const n = fileNodes.find(fn => fn.id === e.id);
  return n && n.type === 'file';
});

const bfsStart = topCodeEntry ? topCodeEntry.id : null;
const depthMap = {};
const bfsOrder = [];

if (bfsStart) {
  // Build adjacency for imports/calls
  const adj = {};
  for (const n of fileNodes) adj[n.id] = [];
  for (const e of fileEdges) {
    if ((e.type === 'imports' || e.type === 'calls') && adj[e.source]) {
      adj[e.source].push(e.target);
    }
  }
  const queue = [bfsStart];
  depthMap[bfsStart] = 0;
  while (queue.length) {
    const cur = queue.shift();
    bfsOrder.push(cur);
    for (const nb of (adj[cur] || [])) {
      if (depthMap[nb] === undefined) {
        depthMap[nb] = depthMap[cur] + 1;
        queue.push(nb);
      }
    }
  }
}

const byDepth = {};
for (const [id, d] of Object.entries(depthMap)) {
  if (!byDepth[d]) byDepth[d] = [];
  byDepth[d].push(id);
}

// D. Non-code files
const nonCodeFiles = { documentation: [], infrastructure: [], data: [], config: [] };
for (const n of fileNodes) {
  if (n.type === 'document') nonCodeFiles.documentation.push({ id: n.id, name: n.name, summary: n.summary });
  else if (['service','pipeline','resource'].includes(n.type)) nonCodeFiles.infrastructure.push({ id: n.id, name: n.name, type: n.type, summary: n.summary });
  else if (['table','schema','endpoint'].includes(n.type)) nonCodeFiles.data.push({ id: n.id, name: n.name, type: n.type, summary: n.summary });
  else if (n.type === 'config') nonCodeFiles.config.push({ id: n.id, name: n.name, summary: n.summary });
}

// E. Clusters (bidirectional edges)
const edgeSet = new Set(fileEdges.map(e => `${e.source}||${e.target}`));
const bidir = [];
for (const e of fileEdges) {
  if (edgeSet.has(`${e.target}||${e.source}`) && e.source < e.target) {
    bidir.push([e.source, e.target]);
  }
}
// Group into clusters by shared members
const clusters = [];
for (const [a, b] of bidir) {
  let merged = false;
  for (const cl of clusters) {
    if (cl.nodes.includes(a) || cl.nodes.includes(b)) {
      if (!cl.nodes.includes(a)) cl.nodes.push(a);
      if (!cl.nodes.includes(b)) cl.nodes.push(b);
      cl.edgeCount++;
      merged = true;
      break;
    }
  }
  if (!merged) clusters.push({ nodes: [a, b], edgeCount: 1 });
}
clusters.sort((a,b) => b.edgeCount - a.edgeCount);
const topClusters = clusters.slice(0, 10);

// F. Node summary index
const nodeSummaryIndex = {};
for (const n of fileNodes) {
  nodeSummaryIndex[n.id] = { name: n.name, type: n.type, summary: n.summary };
}

// G. Layer list
const layerList = { count: layers.length, list: layers.map(l => ({ id: l.id, name: l.name, description: l.description })) };

const result = {
  scriptCompleted: true,
  entryPointCandidates,
  fanInRanking,
  fanOutRanking,
  bfsTraversal: {
    startNode: bfsStart,
    order: bfsOrder,
    depthMap,
    byDepth
  },
  nonCodeFiles,
  clusters: topClusters,
  layers: layerList,
  nodeSummaryIndex,
  totalNodes: fileNodes.length,
  totalEdges: fileEdges.length
};

fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
process.exit(0);
