#!/usr/bin/env node
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

const REPO_ROOT = process.cwd();
const SRC_DIR = path.join(REPO_ROOT, 'src');
const REPORT_DIR = path.join(REPO_ROOT, 'reports', 'one-voice');

const GRAPH_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.d.ts'];
const RUNTIME_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const IGNORED_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage', 'playwright-report']);

const LARGE_FILE_THRESHOLD_LINES = 1200;
const MARKER_PATTERN = /\b(TODO|FIXME|HACK|XXX|@deprecated|legacy|placeholder|stub|not implemented)\b/gi;
const LEGACY_PATH_PATTERN = /(legacy|deprecated|depreciated|old|backup|tmp)/i;

const ENTRYPOINT_CANDIDATES = [
  'src/main.tsx',
  'src/workers/worker.ts',
  'src/workers/ResourceFlowWorker.ts',
  'src/workers/combatWorker.ts',
  'src/workers/DataProcessingWorker.ts',
];

const IMPORT_PATTERN =
  /(?:import|export)\s+(?:type\s+)?(?:[^'"`]*?\sfrom\s*)?['"]([^'"`]+)['"]|import\(\s*['"]([^'"`]+)['"]\s*\)/g;

function toPosixRelative(baseDir, absolutePath) {
  return path.relative(baseDir, absolutePath).split(path.sep).join('/');
}

function firstDirectorySegment(relativeFile) {
  const segment = relativeFile.split('/')[0];
  return segment || '(root)';
}

function safeReadText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function directoryExists(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

async function walk(dirPath) {
  const discovered = [];

  async function recurse(currentPath) {
    const entries = await fsp.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) {
          await recurse(absolutePath);
        }
        continue;
      }

      discovered.push(absolutePath);
    }
  }

  await recurse(dirPath);
  return discovered;
}

function resolveFromBase(basePath) {
  const candidates = [];

  const baseHasExtension = Boolean(path.extname(basePath));
  if (baseHasExtension) {
    candidates.push(basePath);
  } else {
    candidates.push(basePath);
    for (const extension of GRAPH_EXTENSIONS) {
      candidates.push(`${basePath}${extension}`);
    }
  }

  if (directoryExists(basePath)) {
    for (const extension of GRAPH_EXTENSIONS) {
      candidates.push(path.join(basePath, `index${extension}`));
    }
  }

  for (const candidate of candidates) {
    if (fileExists(candidate)) {
      return candidate;
    }
  }

  return null;
}

function resolveLocalImport(specifier, fromAbsoluteFile) {
  let candidateBase = null;

  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    candidateBase = path.resolve(path.dirname(fromAbsoluteFile), specifier);
  } else if (specifier.startsWith('@/')) {
    candidateBase = path.join(SRC_DIR, specifier.slice(2));
  } else if (specifier.startsWith('src/')) {
    candidateBase = path.join(REPO_ROOT, specifier);
  }

  if (!candidateBase) {
    return null;
  }

  return resolveFromBase(candidateBase);
}

function findImports(sourceText) {
  const specifiers = [];
  const matcher = new RegExp(IMPORT_PATTERN.source, 'g');

  let match = matcher.exec(sourceText);
  while (match) {
    const rawSpecifier = match[1] || match[2];
    if (rawSpecifier) {
      specifiers.push(rawSpecifier);
    }
    match = matcher.exec(sourceText);
  }

  return specifiers;
}

function buildGraph(files) {
  const graph = new Map();
  const unresolvedLocalImports = [];

  for (const absoluteFile of files) {
    const fileText = safeReadText(absoluteFile);
    const importSpecifiers = findImports(fileText);
    const resolvedDependencies = [];

    for (const specifier of importSpecifiers) {
      const resolved = resolveLocalImport(specifier, absoluteFile);
      if (resolved) {
        resolvedDependencies.push(toPosixRelative(SRC_DIR, resolved));
      } else if (
        specifier.startsWith('./') ||
        specifier.startsWith('../') ||
        specifier.startsWith('@/') ||
        specifier.startsWith('src/')
      ) {
        unresolvedLocalImports.push({
          file: toPosixRelative(SRC_DIR, absoluteFile),
          specifier,
        });
      }
    }

    graph.set(
      toPosixRelative(SRC_DIR, absoluteFile),
      Array.from(new Set(resolvedDependencies)).sort()
    );
  }

  return { graph, unresolvedLocalImports };
}

function computeReachability(graph, entrypoints) {
  const visited = new Set();
  const queue = [...entrypoints];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) {
      continue;
    }

    visited.add(current);
    const dependencies = graph.get(current) || [];
    for (const dependency of dependencies) {
      if (!visited.has(dependency)) {
        queue.push(dependency);
      }
    }
  }

  return visited;
}

function findStronglyConnectedComponents(graph) {
  let index = 0;
  const stack = [];
  const indexMap = new Map();
  const lowLinkMap = new Map();
  const onStack = new Set();
  const components = [];

  function strongConnect(node) {
    indexMap.set(node, index);
    lowLinkMap.set(node, index);
    index += 1;
    stack.push(node);
    onStack.add(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!graph.has(neighbor)) {
        continue;
      }

      if (!indexMap.has(neighbor)) {
        strongConnect(neighbor);
        lowLinkMap.set(node, Math.min(lowLinkMap.get(node), lowLinkMap.get(neighbor)));
      } else if (onStack.has(neighbor)) {
        lowLinkMap.set(node, Math.min(lowLinkMap.get(node), indexMap.get(neighbor)));
      }
    }

    if (lowLinkMap.get(node) === indexMap.get(node)) {
      const component = [];
      let member = stack.pop();
      while (member) {
        onStack.delete(member);
        component.push(member);
        if (member === node) {
          break;
        }
        member = stack.pop();
      }
      components.push(component.sort());
    }
  }

  for (const node of graph.keys()) {
    if (!indexMap.has(node)) {
      strongConnect(node);
    }
  }

  return components;
}

function summarizeByFirstDirectory(files) {
  const counts = new Map();
  for (const relativeFile of files) {
    const key = firstDirectorySegment(relativeFile);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([directory, count]) => ({ directory, count }))
    .sort((a, b) => b.count - a.count || a.directory.localeCompare(b.directory));
}

function extractMissingToolScriptTargets(packageJson) {
  const scripts = packageJson.scripts || {};
  const missing = [];
  const seen = new Set();

  for (const [scriptName, command] of Object.entries(scripts)) {
    const matcher = /(?:^|\s)(?:node\s+)?(tools\/[\w./-]+)/g;
    let match = matcher.exec(command);

    while (match) {
      const target = match[1];
      const absoluteTarget = path.join(REPO_ROOT, target);
      const dedupeKey = `${scriptName}:${target}`;

      if (!fileExists(absoluteTarget) && !directoryExists(absoluteTarget) && !seen.has(dedupeKey)) {
        missing.push({ script: scriptName, target });
        seen.add(dedupeKey);
      }

      match = matcher.exec(command);
    }
  }

  return missing.sort((a, b) => a.script.localeCompare(b.script) || a.target.localeCompare(b.target));
}

function markdownTable(rows, columns) {
  if (rows.length === 0) {
    return '_None_';
  }

  const header = `| ${columns.map(column => column.label).join(' | ')} |`;
  const separator = `| ${columns.map(() => '---').join(' | ')} |`;
  const body = rows
    .map(row => `| ${columns.map(column => String(row[column.key] ?? '')).join(' | ')} |`)
    .join('\n');

  return `${header}\n${separator}\n${body}`;
}

function formatTimestamp(date) {
  return date.toISOString();
}

async function main() {
  if (!directoryExists(SRC_DIR)) {
    throw new Error('Expected src/ directory was not found.');
  }

  const allWorkspaceFiles = await walk(REPO_ROOT);

  const runtimeSourceFiles = allWorkspaceFiles.filter(file => {
    if (!file.startsWith(SRC_DIR + path.sep)) {
      return false;
    }
    return RUNTIME_EXTENSIONS.includes(path.extname(file));
  });

  const graphSourceFiles = allWorkspaceFiles.filter(file => {
    if (!file.startsWith(SRC_DIR + path.sep)) {
      return false;
    }
    return GRAPH_EXTENSIONS.includes(path.extname(file));
  });

  const fileStats = runtimeSourceFiles.map(absoluteFile => {
    const relative = toPosixRelative(SRC_DIR, absoluteFile);
    const contents = safeReadText(absoluteFile);
    const lines = contents.length === 0 ? 0 : contents.split(/\r?\n/).length;
    const markerMatches = contents.match(MARKER_PATTERN) || [];

    return {
      file: relative,
      lines,
      markerCount: markerMatches.length,
      hasLegacyPathMarker: LEGACY_PATH_PATTERN.test(relative),
    };
  });

  const basenames = new Map();
  for (const stat of fileStats) {
    const name = path.basename(stat.file);
    const list = basenames.get(name) || [];
    list.push(stat.file);
    basenames.set(name, list);
  }

  const duplicateBasenames = Array.from(basenames.entries())
    .filter(([, files]) => files.length > 1)
    .map(([name, files]) => ({
      name,
      count: files.length,
      files: files.sort(),
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const largeFiles = [...fileStats]
    .filter(stat => stat.lines >= LARGE_FILE_THRESHOLD_LINES)
    .sort((a, b) => b.lines - a.lines);

  const markerFiles = [...fileStats]
    .filter(stat => stat.markerCount > 0)
    .sort((a, b) => b.markerCount - a.markerCount || b.lines - a.lines);

  const { graph, unresolvedLocalImports } = buildGraph(graphSourceFiles);

  const entrypoints = ENTRYPOINT_CANDIDATES.filter(candidate =>
    graph.has(toPosixRelative(SRC_DIR, path.join(REPO_ROOT, candidate)))
  ).map(candidate => toPosixRelative(SRC_DIR, path.join(REPO_ROOT, candidate)));

  const reachable = computeReachability(graph, entrypoints);
  const disconnected = Array.from(graph.keys())
    .filter(node => !reachable.has(node))
    .sort();

  const disconnectedByDirectory = summarizeByFirstDirectory(disconnected);

  const components = findStronglyConnectedComponents(graph);
  const cycles = components
    .filter(component => {
      if (component.length > 1) {
        return true;
      }
      const [single] = component;
      return (graph.get(single) || []).includes(single);
    })
    .sort((a, b) => b.length - a.length || a[0].localeCompare(b[0]));

  const packageJson = JSON.parse(safeReadText(path.join(REPO_ROOT, 'package.json')) || '{}');
  const missingToolScriptTargets = extractMissingToolScriptTargets(packageJson);

  const legacyCandidates = fileStats
    .filter(stat => stat.hasLegacyPathMarker)
    .map(stat => stat.file)
    .sort();

  const report = {
    generatedAt: formatTimestamp(new Date()),
    thresholds: {
      largeFileLines: LARGE_FILE_THRESHOLD_LINES,
    },
    summary: {
      runtimeSourceFileCount: runtimeSourceFiles.length,
      graphSourceFileCount: graphSourceFiles.length,
      duplicateBasenameCount: duplicateBasenames.length,
      largeFileCount: largeFiles.length,
      markerFileCount: markerFiles.length,
      markerTotalCount: markerFiles.reduce((sum, file) => sum + file.markerCount, 0),
      unresolvedLocalImportCount: unresolvedLocalImports.length,
      cycleCount: cycles.length,
      entrypointCount: entrypoints.length,
      reachableFromEntrypointsCount: reachable.size,
      disconnectedFromEntrypointsCount: disconnected.length,
      missingToolScriptTargetCount: missingToolScriptTargets.length,
      legacyPathCandidateCount: legacyCandidates.length,
    },
    entrypoints,
    architectureSeams: {
      duplicateBasenames,
      largeFiles,
      markerFiles,
      unresolvedLocalImports,
      disconnectedFromEntrypoints: {
        files: disconnected,
        byDirectory: disconnectedByDirectory,
      },
      cycles,
      missingToolScriptTargets,
      legacyPathCandidates: legacyCandidates,
    },
  };

  await fsp.mkdir(REPORT_DIR, { recursive: true });

  const jsonPath = path.join(REPORT_DIR, 'codebase-audit.json');
  const markdownPath = path.join(REPORT_DIR, 'codebase-audit.md');

  await fsp.writeFile(jsonPath, JSON.stringify(report, null, 2));

  const duplicateRows = duplicateBasenames.slice(0, 25).map(item => ({
    name: item.name,
    count: item.count,
    sample: item.files.slice(0, 3).join('<br/>'),
  }));

  const largeRows = largeFiles.slice(0, 25).map(item => ({
    file: item.file,
    lines: item.lines,
    markers: item.markerCount,
  }));

  const markerRows = markerFiles.slice(0, 25).map(item => ({
    file: item.file,
    markers: item.markerCount,
    lines: item.lines,
  }));

  const disconnectedRows = disconnectedByDirectory.slice(0, 25).map(item => ({
    directory: item.directory,
    count: item.count,
  }));

  const cycleRows = cycles.slice(0, 20).map(cycle => ({
    length: cycle.length,
    chain: cycle.join(' -> '),
  }));

  const missingToolRows = missingToolScriptTargets.slice(0, 50).map(item => ({
    script: item.script,
    target: item.target,
  }));

  const unresolvedRows = unresolvedLocalImports.slice(0, 50).map(item => ({
    file: item.file,
    specifier: item.specifier,
  }));

  const markdown = `# One Voice Codebase Audit\n\nGenerated: ${report.generatedAt}\n\n## Summary\n- Runtime source files: ${report.summary.runtimeSourceFileCount}\n- Graph source files: ${report.summary.graphSourceFileCount}\n- Duplicated basenames: ${report.summary.duplicateBasenameCount}\n- Large files (>= ${LARGE_FILE_THRESHOLD_LINES} lines): ${report.summary.largeFileCount}\n- Files with TODO/deprecated/stub markers: ${report.summary.markerFileCount} (${report.summary.markerTotalCount} total markers)\n- Circular dependency groups: ${report.summary.cycleCount}\n- Reachable from entrypoints: ${report.summary.reachableFromEntrypointsCount} / ${report.summary.graphSourceFileCount}\n- Disconnected from entrypoints: ${report.summary.disconnectedFromEntrypointsCount}\n- Unresolved local imports: ${report.summary.unresolvedLocalImportCount}\n- Missing tools/* script targets: ${report.summary.missingToolScriptTargetCount}\n\n## Entrypoints\n${entrypoints.length > 0 ? entrypoints.map(item => `- ${item}`).join('\n') : '- None found'}\n\n## Disconnected Files By Directory\n${markdownTable(disconnectedRows, [
    { key: 'directory', label: 'Directory' },
    { key: 'count', label: 'Count' },
  ])}\n\n## Top Duplicate Basenames\n${markdownTable(duplicateRows, [
    { key: 'name', label: 'Basename' },
    { key: 'count', label: 'Count' },
    { key: 'sample', label: 'Sample Paths' },
  ])}\n\n## Top Large Files\n${markdownTable(largeRows, [
    { key: 'file', label: 'File' },
    { key: 'lines', label: 'Lines' },
    { key: 'markers', label: 'Markers' },
  ])}\n\n## Marker Hotspots\n${markdownTable(markerRows, [
    { key: 'file', label: 'File' },
    { key: 'markers', label: 'Markers' },
    { key: 'lines', label: 'Lines' },
  ])}\n\n## Circular Dependency Samples\n${markdownTable(cycleRows, [
    { key: 'length', label: 'Length' },
    { key: 'chain', label: 'Cycle' },
  ])}\n\n## Unresolved Local Imports\n${markdownTable(unresolvedRows, [
    { key: 'file', label: 'File' },
    { key: 'specifier', label: 'Specifier' },
  ])}\n\n## Missing Tools Script Targets\n${markdownTable(missingToolRows, [
    { key: 'script', label: 'Script' },
    { key: 'target', label: 'Missing Target' },
  ])}\n\n## Legacy Path Candidates\n${legacyCandidates.length > 0 ? legacyCandidates.slice(0, 100).map(file => `- ${file}`).join('\n') : '- None'}\n`;

  await fsp.writeFile(markdownPath, markdown);

  console.log(`Wrote ${toPosixRelative(REPO_ROOT, jsonPath)}`);
  console.log(`Wrote ${toPosixRelative(REPO_ROOT, markdownPath)}`);
  console.log(`Disconnected files: ${report.summary.disconnectedFromEntrypointsCount}`);
  console.log(`Duplicate basenames: ${report.summary.duplicateBasenameCount}`);
  console.log(`Circular dependency groups: ${report.summary.cycleCount}`);
}

main().catch(error => {
  console.error('[one-voice-audit] Failed:', error);
  process.exitCode = 1;
});
