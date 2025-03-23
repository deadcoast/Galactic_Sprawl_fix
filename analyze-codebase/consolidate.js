/* eslint-env node */
/* global console, process */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import { execSync } from 'child_process';
import minimist from 'minimist';

// Get the current file path and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const outputDir = path.join(__dirname, 'output');
const hashLogFile = path.join(outputDir, 'file_hashes.log');

// Initialize hash log file
fs.writeFileSync(hashLogFile, '# File Content Hashes\n\n');

// Load the analysis report
const reportPath = path.join(outputDir, 'codebase_analysis_report.json');
let report;

try {
  const reportData = fs.readFileSync(reportPath, 'utf8');
  report = JSON.parse(reportData);
} catch (err) {
  console.error(`Error reading analysis report: ${err.message}`);
  console.error('Please run analyze.js first to generate the report.');
  process.exit(1);
}

// Create directories for consolidated code
const sharedDir = path.join(projectRoot, 'src', 'shared');
const sharedComponentsDir = path.join(sharedDir, 'components');
const sharedUtilsDir = path.join(sharedDir, 'utils');
const sharedLibDir = path.join(sharedDir, 'lib');
const sharedTypesDir = path.join(sharedDir, 'types');
const backupDir = path.join(__dirname, 'backup');

// Create directories if they don't exist
[sharedDir, sharedComponentsDir, sharedUtilsDir, sharedLibDir, sharedTypesDir, backupDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Create directory for hash-organized files (for debugging)
const hashOrgDir = path.join(outputDir, 'hash_organized');
if (!fs.existsSync(hashOrgDir)) {
  fs.mkdirSync(hashOrgDir, { recursive: true });
}

function getTargetDir(filePath) {
  // Determine the target directory based on file path and extension
  const ext = path.extname(filePath);
  
  if (filePath.includes('/components/') || ext === '.tsx' || ext === '.jsx') {
    return sharedComponentsDir;
  } else if (filePath.includes('/utils/') || filePath.includes('/helpers/')) {
    return sharedUtilsDir;
  } else if (filePath.includes('/types/') || filePath.includes('/interfaces/')) {
    return sharedTypesDir;
  } else if (filePath.includes('/lib/') || filePath.includes('/services/')) {
    return sharedLibDir;
  }
  
  // Default to utils
  return sharedUtilsDir;
}

function consolidateIdenticalFiles() {
  console.log('\nConsolidating files with identical content:');
  
  // Process identical files
  const identicalFiles = report.identicalFiles || {};
  
  // Create hash log entries
  fs.appendFileSync(hashLogFile, '## Consolidated Files\n\n');
  
  for (const [hash, filePaths] of Object.entries(identicalFiles)) {
    if (!filePaths || filePaths.length < 2) {
      continue;
    }
    
    // Use the first file as source
    const sourcePath = path.join(projectRoot, filePaths[0]);
    const fileName = path.basename(sourcePath);
    
    try {
      // Read content
      const content = fs.readFileSync(sourcePath, 'utf8');
      
      // Verify hash for integrity
      const contentHash = crypto.createHash('md5').update(content).digest('hex');
      const hashMatch = hash === contentHash ? 'verified' : 'mismatch';
      
      // Determine the target directory
      const targetDir = getTargetDir(filePaths[0]);
      const targetPath = path.join(targetDir, fileName);
      
      // Create a backup
      for (const filePath of filePaths) {
        const fullPath = path.join(projectRoot, filePath);
        const backupPath = path.join(backupDir, filePath);
        const backupDirPath = path.dirname(backupPath);
        
        if (!fs.existsSync(backupDirPath)) {
          fs.mkdirSync(backupDirPath, { recursive: true });
        }
        
        fs.copyFileSync(fullPath, backupPath);
      }
      
      // Write to shared location
      fs.writeFileSync(targetPath, content);
      
      // Create hash-specific directory for debugging
      const hashDir = path.join(hashOrgDir, hash.substring(0, 8));
      if (!fs.existsSync(hashDir)) {
        fs.mkdirSync(hashDir, { recursive: true });
      }
      fs.writeFileSync(path.join(hashDir, fileName), content);
      
      // Log hash information
      fs.appendFileSync(hashLogFile, `### Hash: ${hash} (${hashMatch})\n`);
      fs.appendFileSync(hashLogFile, `- Target file: ${path.relative(projectRoot, targetPath)}\n`);
      filePaths.forEach(filePath => {
        fs.appendFileSync(hashLogFile, `- Original: ${filePath}\n`);
      });
      fs.appendFileSync(hashLogFile, '\n');
      
      console.log(`- Consolidated ${filePaths.length} copies of ${fileName} to ${targetPath} (Hash: ${hash.substring(0, 8)})`);
    } catch (err) {
      console.error(`  Error consolidating ${fileName}: ${err.message}`);
    }
  }
}

function createIndexFiles() {
  console.log('\nCreating index files for shared directories:');
  
  function createIndexForDir(dir) {
    if (!fs.existsSync(dir)) {
      console.log(`- Skipping ${dir} (doesn't exist)`);
      return;
    }
    
    const files = fs.readdirSync(dir).filter(f => 
      !f.startsWith('.') && 
      !f.startsWith('index.') && 
      (f.endsWith('.js') || f.endsWith('.jsx') || f.endsWith('.ts') || f.endsWith('.tsx'))
    );
    
    if (files.length === 0) {
      console.log(`- Skipping ${dir} (no eligible files)`);
      return;
    }
    
    let indexContent = '/**\n * Generated index file for shared components\n */\n\n';
    
    for (const file of files) {
      const baseName = path.basename(file, path.extname(file));
      indexContent += `export * from './${baseName}';\n`;
    }
    
    fs.writeFileSync(path.join(dir, 'index.ts'), indexContent);
    console.log(`- Created index file for ${path.basename(dir)} (${files.length} exports)`);
  }
  
  createIndexForDir(sharedComponentsDir);
  createIndexForDir(sharedUtilsDir);
  createIndexForDir(sharedLibDir);
  createIndexForDir(sharedTypesDir);
}

function generateImportUpdates() {
  console.log('\nGenerating import update suggestions:');
  
  const importUpdatesPath = path.join(outputDir, 'IMPORT_UPDATES.md');
  let importUpdatesContent = '# Import Update Guide\n\n';
  importUpdatesContent += 'This guide provides suggestions for updating imports after consolidation.\n\n';
  
  const identicalFiles = report.identicalFiles || {};
  
  // Add hash information to documentation
  importUpdatesContent += '## Content Hash Information\n\n';
  importUpdatesContent += 'Each set of identical files is identified by a content hash.\n';
  importUpdatesContent += 'These hashes can be used to verify file integrity and track changes.\n\n';
  
  for (const [hash, filePaths] of Object.entries(identicalFiles)) {
    if (!filePaths || filePaths.length < 2) {
      continue;
    }
    
    const fileName = path.basename(filePaths[0]);
    const baseName = path.basename(fileName, path.extname(fileName));
    const targetDir = getTargetDir(filePaths[0]);
    const relativePath = path.relative(path.join(projectRoot, 'src'), targetDir);
    const importPath = relativePath.split(path.sep).join('/');
    
    importUpdatesContent += `## ${fileName} (Hash: ${hash})\n\n`;
    importUpdatesContent += `Original locations:\n`;
    
    filePaths.forEach(filePath => {
      importUpdatesContent += `- \`${filePath}\`\n`;
    });
    
    importUpdatesContent += `\nNew location: \`src/${importPath}/${fileName}\`\n\n`;
    importUpdatesContent += `Hash directory (for debugging): \`${path.relative(projectRoot, path.join(hashOrgDir, hash.substring(0, 8)))}\`\n\n`;
    importUpdatesContent += `Replace imports like:\n\`\`\`typescript\nimport { ${baseName} } from '../path/to/original/${baseName}';\n\`\`\`\n\n`;
    importUpdatesContent += `With:\n\`\`\`typescript\nimport { ${baseName} } from '@/shared/${path.basename(targetDir)}/${baseName}';\n\`\`\`\n\n`;
    importUpdatesContent += `Or if you don't have path aliases configured:\n\`\`\`typescript\nimport { ${baseName} } from '../../../../shared/${path.basename(targetDir)}/${baseName}';\n\`\`\`\n\n`;
    importUpdatesContent += `---\n\n`;
  }
  
  fs.writeFileSync(importUpdatesPath, importUpdatesContent);
  console.log(`- Import update suggestions written to ${importUpdatesPath}`);
}

// Create a map of duplicated components to help with manual cleanup
function createDuplicateMap() {
  console.log('\nCreating duplicate component map:');
  
  const mapPath = path.join(outputDir, 'duplicate_component_map.json');
  
  // Start with identical files
  const duplicateMap = {
    identicalFiles: report.identicalFiles || {},
    similarFiles: report.similarFiles || {},
    emptyFiles: report.emptyFiles || [],
    sharedComponentsCreated: [],
    hashToFileMap: {} // Add hash lookup for debugging
  };
  
  // Add newly created shared components
  for (const [hash, filePaths] of Object.entries(report.identicalFiles || {})) {
    if (!filePaths || filePaths.length < 2) {
      continue;
    }
    
    const fileName = path.basename(filePaths[0]);
    const targetDir = getTargetDir(filePaths[0]);
    const newPath = path.join('src/shared', path.basename(targetDir), fileName);
    
    // Store hash information for tracking
    duplicateMap.hashToFileMap[hash] = {
      componentName: path.basename(fileName, path.extname(fileName)),
      originalPaths: filePaths,
      newPath,
      hashValue: hash
    };
    
    duplicateMap.sharedComponentsCreated.push({
      originalPaths: filePaths,
      newPath,
      hash: hash // Include hash in output
    });
  }
  
  fs.writeFileSync(mapPath, JSON.stringify(duplicateMap, null, 2));
  console.log(`- Duplicate component map written to ${mapPath}`);
  
  // Create hash lookup file for quick reference
  const hashLookupPath = path.join(outputDir, 'hash_lookup.json');
  fs.writeFileSync(hashLookupPath, JSON.stringify(duplicateMap.hashToFileMap, null, 2));
  console.log(`- Hash lookup table written to ${hashLookupPath}`);
}

// Main execution
console.log('Starting consolidation process for duplicate files...');

// Consolidate files with identical content
consolidateIdenticalFiles();

// Create index files
createIndexFiles();

// Generate import update suggestions
generateImportUpdates();

// Create a map of duplicated components
createDuplicateMap();

console.log('\nConsolidation process complete!');
console.log('Original files have been backed up to the backup directory.');
console.log('Hash-organized copies of files are available in the hash_organized directory.');
console.log('Please review the changes before committing them to version control.');

// Get command line arguments
const args = minimist(process.argv.slice(2));
const analysisDir = args.analysisDir || path.join(__dirname, 'output', 'latest');
const cliProjectRoot = args.projectRoot || path.resolve(__dirname, '..');

// Get project name from package.json or fallback to directory name
let projectName = 'Galactic Sprawl';
try {
  const packageJsonPath = path.join(cliProjectRoot, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  projectName = packageJson.name || projectName;
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
} catch (error) {
  console.log('Could not read package.json, using directory name for project name');
  projectName = path.basename(cliProjectRoot);
}

// Ensure project name is properly capitalized
projectName = projectName.split(/[_\-\s]/).map(word => 
  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
).join(' ');

console.log(`Generating technical report for ${projectName}...`);

// Read the template
const templatePath = path.join(__dirname, 'report_template.md');
const template = fs.readFileSync(templatePath, 'utf8');

// Read analysis data
function readAnalysisData() {
  const data = {};
  
  // Basic stats
  try {
    const statsPath = path.join(analysisDir, 'stats.json');
    if (fs.existsSync(statsPath)) {
      data.stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
    }
  } catch (error) {
    console.error('Error reading stats:', error);
  }
  
  // Dependency data
  try {
    const dependenciesPath = path.join(analysisDir, 'dependencies.json');
    if (fs.existsSync(dependenciesPath)) {
      data.dependencies = JSON.parse(fs.readFileSync(dependenciesPath, 'utf8'));
    }
  } catch (error) {
    console.error('Error reading dependencies:', error);
  }
  
  // Code duplication data
  try {
    const duplicationPath = path.join(analysisDir, 'duplication.json');
    if (fs.existsSync(duplicationPath)) {
      data.duplication = JSON.parse(fs.readFileSync(duplicationPath, 'utf8'));
    }
  } catch (error) {
    console.error('Error reading duplication data:', error);
  }
  
  // Load linting data
  try {
    const lintingPath = path.join(analysisDir, 'linting.json');
    if (fs.existsSync(lintingPath)) {
      data.linting = JSON.parse(fs.readFileSync(lintingPath, 'utf8'));
    } else {
      // Try to find other ESLint reports
      const eslintReportPath = path.join(cliProjectRoot, 'eslint-report.json');
      if (fs.existsSync(eslintReportPath)) {
        const eslintReport = JSON.parse(fs.readFileSync(eslintReportPath, 'utf8'));
        data.linting = processEslintReport(eslintReport);
      }
    }
  } catch (error) {
    console.error('Error reading linting data:', error);
  }
  
  return data;
}

// Process ESLint report data into a more usable format
function processEslintReport(eslintReport) {
  const result = {
    totalErrors: 0,
    totalWarnings: 0,
    byRule: {},
    byFile: {},
    bySeverity: {
      error: 0,
      warning: 0,
      info: 0
    }
  };
  
  if (Array.isArray(eslintReport)) {
    eslintReport.forEach(fileResult => {
      if (fileResult.messages && fileResult.messages.length > 0) {
        // Initialize file entry if it doesn't exist
        const relativeFilePath = path.relative(cliProjectRoot, fileResult.filePath);
        if (!result.byFile[relativeFilePath]) {
          result.byFile[relativeFilePath] = {
            errors: 0, 
            warnings: 0,
            messages: []
          };
        }
        
        // Process each message in the file
        fileResult.messages.forEach(message => {
          // Track by rule
          const ruleId = message.ruleId || 'unknown';
          if (!result.byRule[ruleId]) {
            result.byRule[ruleId] = {
              count: 0,
              errors: 0,
              warnings: 0
            };
          }
          
          // Update counts
          if (message.severity === 2) {
            result.totalErrors++;
            result.byRule[ruleId].errors++;
            result.byFile[relativeFilePath].errors++;
            result.bySeverity.error++;
          } else if (message.severity === 1) {
            result.totalWarnings++;
            result.byRule[ruleId].warnings++;
            result.byFile[relativeFilePath].warnings++;
            result.bySeverity.warning++;
          } else {
            result.bySeverity.info++;
          }
          
          result.byRule[ruleId].count++;
          
          // Add message to file
          result.byFile[relativeFilePath].messages.push({
            ruleId,
            severity: message.severity,
            message: message.message,
            line: message.line,
            column: message.column
          });
        });
      }
    });
  }
  
  return result;
}

// Generate the report content
function generateReport(data) {
  let report = template;
  
  // Replace project name placeholders
  report = report.replace(/\{\{PROJECT_NAME\}\}/g, projectName);
  
  // Basic stats section
  let statsSection = '## Codebase Statistics\n\n';
  if (data.stats) {
    statsSection += `- **Total files:** ${data.stats.totalFiles || 'N/A'}\n`;
    statsSection += `- **Lines of code:** ${data.stats.totalLines || 'N/A'}\n`;
    statsSection += `- **Files by language:**\n`;
    
    if (data.stats.filesByType) {
      Object.entries(data.stats.filesByType).forEach(([type, count]) => {
        statsSection += `  - ${type}: ${count}\n`;
      });
    }
  } else {
    statsSection += '*No statistics data available*\n';
  }
  
  // Add linting section
  let lintingSection = '## Code Quality Issues\n\n';
  if (data.linting) {
    lintingSection += `- **Total errors:** ${data.linting.totalErrors || 0}\n`;
    lintingSection += `- **Total warnings:** ${data.linting.totalWarnings || 0}\n\n`;
    
    lintingSection += `### Issues by Severity\n\n`;
    lintingSection += `- **Errors:** ${data.linting.bySeverity?.error || 0}\n`;
    lintingSection += `- **Warnings:** ${data.linting.bySeverity?.warning || 0}\n`;
    lintingSection += `- **Info:** ${data.linting.bySeverity?.info || 0}\n\n`;
    
    // Add top rules
    lintingSection += `### Top Issues by Rule\n\n`;
    if (data.linting.byRule) {
      const topRules = Object.entries(data.linting.byRule)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10); // Get top 10
      
      if (topRules.length > 0) {
        lintingSection += '| Rule | Count | Errors | Warnings |\n';
        lintingSection += '|------|-------|--------|----------|\n';
        
        topRules.forEach(([rule, info]) => {
          lintingSection += `| ${rule} | ${info.count} | ${info.errors} | ${info.warnings} |\n`;
        });
      } else {
        lintingSection += '*No rule data available*\n';
      }
    }
    
    // Add files with most issues
    lintingSection += `\n### Files with Most Issues\n\n`;
    if (data.linting.byFile) {
      const worstFiles = Object.entries(data.linting.byFile)
        .sort((a, b) => (b[1].errors + b[1].warnings) - (a[1].errors + a[1].warnings))
        .slice(0, 10); // Get top 10
      
      if (worstFiles.length > 0) {
        lintingSection += '| File | Total Issues | Errors | Warnings |\n';
        lintingSection += '|------|--------------|--------|----------|\n';
        
        worstFiles.forEach(([file, info]) => {
          const totalIssues = info.errors + info.warnings;
          lintingSection += `| ${file} | ${totalIssues} | ${info.errors} | ${info.warnings} |\n`;
        });
      } else {
        lintingSection += '*No file data available*\n';
      }
    }
    
  } else {
    lintingSection += '*No linting data available*\n';
  }
  
  // Add duplication section
  let duplicationSection = '## Code Duplication\n\n';
  if (data.duplication && data.duplication.duplicates && data.duplication.duplicates.length > 0) {
    duplicationSection += `- **Total duplicate blocks:** ${data.duplication.duplicates.length}\n`;
    duplicationSection += `- **Total duplicate lines:** ${data.duplication.totalDuplicateLines || 'N/A'}\n\n`;
    
    duplicationSection += `### Top Duplicated Code Patterns\n\n`;
    const topDuplicates = data.duplication.duplicates
      .sort((a, b) => b.lines - a.lines)
      .slice(0, 5); // Top 5 duplicates
    
    topDuplicates.forEach((dup, index) => {
      duplicationSection += `#### Duplicate Block ${index + 1} (${dup.lines} lines)\n\n`;
      duplicationSection += 'Found in:\n';
      
      if (dup.instances && dup.instances.length > 0) {
        dup.instances.forEach(instance => {
          duplicationSection += `- ${instance.file} (lines ${instance.lineStart}-${instance.lineEnd})\n`;
        });
      }
      
      duplicationSection += '\n';
    });
  } else {
    duplicationSection += '*No duplication data available*\n';
  }
  
  // Dependency section
  let dependencySection = '## Dependencies\n\n';
  if (data.dependencies) {
    if (data.dependencies.directDependencies) {
      dependencySection += `### Direct Dependencies (${Object.keys(data.dependencies.directDependencies).length})\n\n`;
      dependencySection += '| Package | Version |\n';
      dependencySection += '|---------|--------|\n';
      
      Object.entries(data.dependencies.directDependencies).forEach(([pkg, version]) => {
        dependencySection += `| ${pkg} | ${version} |\n`;
      });
    }
    
    dependencySection += '\n### Dependency Analysis\n\n';
    dependencySection += `- **Total direct dependencies:** ${Object.keys(data.dependencies.directDependencies || {}).length}\n`;
    dependencySection += `- **Total dev dependencies:** ${Object.keys(data.dependencies.devDependencies || {}).length}\n`;
    
    if (data.dependencies.outdated && data.dependencies.outdated.length > 0) {
      dependencySection += '\n#### Outdated Dependencies\n\n';
      dependencySection += '| Package | Current | Latest | Type |\n';
      dependencySection += '|---------|---------|--------|------|\n';
      
      data.dependencies.outdated.forEach(dep => {
        dependencySection += `| ${dep.name} | ${dep.current} | ${dep.latest} | ${dep.type} |\n`;
      });
    }
  } else {
    dependencySection += '*No dependency data available*\n';
  }
  
  // Combine all sections
  report = report
    .replace('{{STATS_SECTION}}', statsSection)
    .replace('{{LINTING_SECTION}}', lintingSection)
    .replace('{{DUPLICATION_SECTION}}', duplicationSection)
    .replace('{{DEPENDENCY_SECTION}}', dependencySection);
  
  return report;
}

// Generate and save the report
const analysisData = readAnalysisData();
const reportContent = generateReport(analysisData);

// Save the report
const outputReportPath = path.join(analysisDir, 'TECHNICAL_REPORT.md');
fs.writeFileSync(outputReportPath, reportContent);

console.log(`Technical report saved to: ${outputReportPath}`);

// Copy the report to the project root for easy access
const rootReportPath = path.join(__dirname, 'TECHNICAL_REPORT.md');
fs.writeFileSync(rootReportPath, reportContent);

console.log(`Technical report also saved to: ${rootReportPath}`);
