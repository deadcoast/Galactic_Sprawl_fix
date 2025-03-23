#!/usr/bin/env node
/* eslint-env node, browser, es2021 */
/* global console, process */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
 
import crypto from 'crypto';
import { analyzeCodeQuality } from './analysis/qualityAnalyzer.js';
import { analyzeDependencies } from './analysis/dependencyAnalyzer.js';
import { analyzeReactComponents } from './analysis/reactAnalyzer.js';
import { findCodeDuplication } from './analysis/duplicateAnalyzer.js';
import { analyzeCodeHistory } from './analysis/historyAnalyzer.js';
import { generateVisualization } from './visualization/visualizer.js';
import { outputDir } from './outputPath.js';

// Get the current file path and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Ensure output directory exists (should be already created by main.js)
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Directories to skip
const skipDirs = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'out',
  '.next',
  '.vscode',
  '.idea',
  'coverage',
  'analyze-codebase/output',
  'analyze-codebase/backup'
];

// File extensions to process
const processExtensions = [
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.css',
  '.scss',
  '.less',
  '.html',
  '.json',
  '.md'
];

// Skip files larger than this (in bytes)
const maxFileSize = 1024 * 1024; // 1MB

console.log('Starting codebase analysis...');

// Initialize report data structure
const reportData = {
  projectName: 'Galactic Sprawl',
  scanDate: new Date().toISOString(),
  totalFiles: 0,
  totalDirectories: 0,
  totalLines: 0,
  totalSize: 0,
  languageCounts: {},
  identicalFiles: {},
  similarFiles: {},
  emptyFiles: []
};

// Start processing from the project root
console.log(`Analyzing project root: ${projectRoot}`);
try {
  reportData.directoryStructure = processDirectory(projectRoot);
  
  // Run enhanced analysis on all source files
  const sourceFiles = getAllSourceFiles(projectRoot);
  console.log(`Found ${sourceFiles.length} source files to analyze`);
  
  // Run all analysis modules with proper error handling
  try {
    runEnhancedAnalysis(sourceFiles, reportData);
  } catch (error) {
    console.error(`Error during enhanced analysis: ${error.message}`);
    console.error('Continuing with basic analysis results only');
  }
  
  // Clean up the identical files that only have a single instance
  Object.keys(reportData.identicalFiles).forEach(hash => {
    if (reportData.identicalFiles[hash].length <= 1) {
      delete reportData.identicalFiles[hash];
    }
  });
  
  // Clean up the similar files that only have a single instance
  Object.keys(reportData.similarFiles).forEach(baseName => {
    if (reportData.similarFiles[baseName].length <= 1) {
      delete reportData.similarFiles[baseName];
    }
  });
  
  // Write the report data to a file
  fs.writeFileSync(
    path.join(outputDir, 'codebase_analysis_report.json'),
    JSON.stringify(reportData, null, 2)
  );
  
  console.log(`\nAnalysis complete!`);
  console.log(`Found ${reportData.totalFiles} files in ${reportData.totalDirectories} directories`);
  console.log(`Total codebase size: ${(reportData.totalSize / 1024 / 1024).toFixed(2)}MB`);
  console.log(`Total lines of code: ${reportData.totalLines.toLocaleString()}`);
  console.log(`Found ${Object.keys(reportData.identicalFiles).length} sets of identical files`);
  console.log(`Found ${Object.keys(reportData.similarFiles).length} sets of similarly named files`);
  console.log(`Found ${reportData.emptyFiles.length} empty files`);
  
  console.log(`\nDetailed report saved to: ${path.join(outputDir, 'codebase_analysis_report.json')}`);
  console.log('To generate a technical report, run: node main.js report');
  
} catch (error) {
  console.error(`Fatal error during analysis: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
}

// Process directory
function processDirectory(dirPath, relPath = '') {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const dirInfo = {
    path: relPath,
    files: [],
    subdirectories: [],
    fileCount: 0,
    totalSize: 0
  };
  
  reportData.totalDirectories++;
  
  for (const entry of entries) {
    // Skip hidden files and directories
    if (entry.name.startsWith('.')) {
      continue;
    }
    
    const fullPath = path.join(dirPath, entry.name);
    const entryRelPath = path.join(relPath, entry.name);
    
    if (entry.isDirectory()) {
      // Skip directories in the exclude list
      if (skipDirs.includes(entry.name) || 
          skipDirs.includes(entryRelPath)) {
        continue;
      }
      
      const subDirInfo = processDirectory(fullPath, entryRelPath);
      dirInfo.subdirectories.push(subDirInfo);
      dirInfo.fileCount += subDirInfo.fileCount;
      dirInfo.totalSize += subDirInfo.totalSize;
    } else if (entry.isFile()) {
      // Process file
      const ext = path.extname(entry.name).toLowerCase();
      
      // Skip files with extensions we're not interested in
      if (!processExtensions.includes(ext)) {
        continue;
      }
      
      try {
        const stats = fs.statSync(fullPath);
        
        // Skip large files
        if (stats.size > maxFileSize) {
          console.log(`Skipping large file: ${entryRelPath} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
          continue;
        }
        
        dirInfo.fileCount++;
        dirInfo.totalSize += stats.size;
        reportData.totalFiles++;
        reportData.totalSize += stats.size;
        
        // Count by language/extension
        reportData.languageCounts[ext] = (reportData.languageCounts[ext] || 0) + 1;
        
        // Get file info
        const fileInfo = {
          name: entry.name,
          path: entryRelPath,
          size: stats.size,
          extension: ext
        };
        
        // Add to directory info
        dirInfo.files.push(fileInfo);
        
        // Check for empty files
        if (stats.size === 0) {
          reportData.emptyFiles.push(entryRelPath);
          continue;
        }
        
        // Read file content for duplication detection
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Count lines
        const lines = content.split('\n').length;
        reportData.totalLines += lines;
        fileInfo.lines = lines;
        
        // Generate hash for duplicate detection
        const hash = crypto.createHash('md5').update(content).digest('hex');
        fileInfo.hash = hash;
        
        // Add to identical files map
        if (!reportData.identicalFiles[hash]) {
          reportData.identicalFiles[hash] = [];
        }
        reportData.identicalFiles[hash].push(entryRelPath);
        
        // Add to similar files map (by basename)
        const baseName = path.basename(entry.name);
        if (!reportData.similarFiles[baseName]) {
          reportData.similarFiles[baseName] = [];
        }
        reportData.similarFiles[baseName].push(entryRelPath);
        
      } catch (error) {
        console.error(`Error processing file ${entryRelPath}:`, error.message);
      }
    }
  }
  
  return dirInfo;
}

// Enhanced analysis functions
async function runEnhancedAnalysis(sourceFiles, reportData) {
  console.log('\nRunning enhanced analysis...');
  
  // Parallel analysis promises with proper error handling
  const analysisPromises = [
    // Run code quality analysis
    analyzeCodeQuality(sourceFiles)
      .then(qualityResults => {
        console.log('✓ Code quality analysis complete');
        reportData.quality = qualityResults;
        return qualityResults;
      })
      .catch(error => {
        console.error(`Error in code quality analysis: ${error.message}`);
        reportData.quality = { error: error.message };
        return null;
      }),
    
    // Run dependency analysis
    analyzeDependencies(sourceFiles)
      .then(dependencyResults => {
        console.log('✓ Dependency analysis complete');
        reportData.dependencies = dependencyResults;
        return dependencyResults;
      })
      .catch(error => {
        console.error(`Error in dependency analysis: ${error.message}`);
        reportData.dependencies = { error: error.message };
        return null;
      }),
    
    // Run React component analysis
    analyzeReactComponents(sourceFiles.filter(f => f.endsWith('.jsx') || f.endsWith('.tsx')))
      .then(reactResults => {
        console.log('✓ React component analysis complete');
        reportData.reactComponents = reactResults;
        return reactResults;
      })
      .catch(error => {
        console.error(`Error in React component analysis: ${error.message}`);
        reportData.reactComponents = { error: error.message };
        return null;
      }),
    
    // Run code duplication analysis
    findCodeDuplication(projectRoot)
      .then(duplicationResults => {
        console.log('✓ Code duplication analysis complete');
        reportData.duplication = duplicationResults;
        return duplicationResults;
      })
      .catch(error => {
        console.error(`Error in code duplication analysis: ${error.message}`);
        reportData.duplication = { error: error.message };
        return null;
      }),
    
    // Run code history analysis
    analyzeCodeHistory(projectRoot)
      .then(historyResults => {
        console.log('✓ Code history analysis complete');
        reportData.history = historyResults;
        return historyResults;
      })
      .catch(error => {
        console.error(`Error in code history analysis: ${error.message}`);
        reportData.history = { error: error.message };
        return null;
      })
  ];
  
  // Wait for all analysis to complete
  await Promise.allSettled(analysisPromises);
  
  // Generate visualizations with proper error handling
  try {
    generateVisualization(reportData, outputDir);
    console.log('✓ Visualizations generated');
  } catch (error) {
    console.error(`Error generating visualizations: ${error.message}`);
  }
  
  return reportData;
}

// Get all source files recursively
function getAllSourceFiles(rootDir) {
  const sourceFiles = [];
  
  function traverse(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip directories in the exclude list
        const relPath = path.relative(rootDir, fullPath);
        if (skipDirs.includes(entry.name) || skipDirs.includes(relPath)) {
          continue;
        }
        traverse(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        
        // Only process files with extensions we care about
        if (processExtensions.includes(ext)) {
          // Skip large files
          const stats = fs.statSync(fullPath);
          if (stats.size <= maxFileSize) {
            sourceFiles.push(fullPath);
          }
        }
      }
    }
  }
  
  traverse(rootDir);
  return sourceFiles;
}
