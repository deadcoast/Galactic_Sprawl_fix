// analysis/dependencyAnalyzer.js
/* eslint-env node */
/* global console */
import fs from 'fs';
import path from 'path';
import { builtinModules } from 'module';
import { outputDir } from '../outputPath.js';

// Dynamic imports for ES modules
let madge, precinct;

export async function analyzeDependencies(sourceFiles) {
  console.log('Analyzing dependencies...');
  
  // Create logs directory within the dated output folder
  const logsDir = path.join(outputDir, 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  try {
    // Dynamically import dependencies
    try {
      madge = (await import('madge')).default;
    } catch (error) {
      console.error(`Error importing madge: ${error.message}`);
      console.error('Please install dependencies: npm install madge');
      throw new Error('Missing dependency: madge');
    }
    
    try {
      precinct = (await import('precinct')).default;
    } catch (error) {
      console.error(`Error importing precinct: ${error.message}`);
      console.error('Please install dependencies: npm install precinct');
      throw new Error('Missing dependency: precinct');
    }
    
    // Generate full dependency graph
    const dependencyGraph = await madge(path.dirname(sourceFiles[0]), {
      fileExtensions: ['js', 'jsx', 'ts', 'tsx'],
      excludeRegExp: [/node_modules/],
      includeNpm: false
    });
    
    // Find circular dependencies
    const circularDeps = dependencyGraph.circular();
    
    // Analyze external dependencies usage
    const files = dependencyGraph.obj();
    const externalDepsMap = {};
    
    // Process each file to find its external dependencies
    for (const file of sourceFiles) {
      if (!fs.existsSync(file)) {
        continue;
      }
      
      try {
        const fileContent = fs.readFileSync(file, 'utf8');
        const deps = precinct(fileContent, { type: path.extname(file).substring(1) });
        
        // Process each dependency
        deps.forEach(dep => {
          if (!dep.startsWith('.') && !dep.startsWith('/') && !builtinModules.includes(dep)) {
            // This is an external dependency
            externalDepsMap[dep] = externalDepsMap[dep] || [];
            if (!externalDepsMap[dep].includes(file)) {
              externalDepsMap[dep].push(file);
            }
          }
        });
      } catch (error) {
        console.error(`Error analyzing dependencies in ${file}: ${error.message}`);
      }
    }
    
    return {
      graph: files,
      circular: circularDeps,
      external: externalDepsMap
    };
  } catch (error) {
    console.error(`Error in dependency analysis: ${error.message}`);
    return {
      error: error.message,
      graph: {},
      circular: [],
      external: {}
    };
  }
}