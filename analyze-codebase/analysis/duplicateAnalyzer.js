// analysis/duplicateAnalyzer.js
/* eslint-env node */
/* global console */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { outputDir } from '../outputPath.js';

let stringSimilarity;

export async function findCodeDuplication(baseDir) {
  console.log('Finding code duplication...');
  
  try {
    // Check if jscpd is installed
    try {
      execSync('npx jscpd --version', { stdio: 'ignore' });
    } catch (error) {
      console.error(`Error checking for jscpd: ${error.message}`);
      console.error('Please install dependencies: npm install jscpd');
      throw new Error('Missing dependency: jscpd');
    }
    
    // Try to load string-similarity module
    try {
      stringSimilarity = (await import('string-similarity')).default;
    } catch (error) {
      console.error(`Error importing string-similarity: ${error.message}`);
      console.error('Please install dependencies: npm install string-similarity');
    }
    
    // Create output directory for jscpd within the dated output folder
    const duplicationDir = path.join(outputDir, 'duplication-report');
    if (!fs.existsSync(duplicationDir)) {
      fs.mkdirSync(duplicationDir, { recursive: true });
    }
    
    // Run jscpd to detect duplicates
    const reportPath = path.join(duplicationDir, 'jscpd-report.json');
    
    const jscpdCommand = `npx jscpd "${baseDir}" \
      --pattern "**/*.{js,jsx,ts,tsx,css,scss,html}" \
      --ignore "node_modules/**,dist/**,build/**,coverage/**,.git/**" \
      --reporters json \
      --output "${duplicationDir}" \
      --min-lines 5 \
      --min-tokens 50 \
      --threshold 1`;
    
    console.log(`Running jscpd command: ${jscpdCommand}`);
    
    try {
      execSync(jscpdCommand, { stdio: 'pipe' });
    } catch (error) {
      // jscpd can exit with non-zero code if duplicates are found
      // so we need to check if the report was generated regardless
      console.error(`jscpd command exited with error: ${error.message}`);
    }
    
    // Parse jscpd results
    let jscpdResults = { percentage: 0, files: [] };
    
    if (fs.existsSync(reportPath)) {
      try {
        const reportContent = fs.readFileSync(reportPath, 'utf8');
        const report = JSON.parse(reportContent);
        
        jscpdResults = {
          percentage: report.statistics?.total?.percentage || 0,
          exactDuplicates: []
        };
        
        // Process duplications
        if (report.duplicates && Array.isArray(report.duplicates)) {
          report.duplicates.forEach(duplicate => {
            jscpdResults.exactDuplicates.push({
              sourceFile: duplicate.firstFile.name,
              duplicateFile: duplicate.secondFile.name,
              lines: duplicate.firstFile.end - duplicate.firstFile.start,
              tokens: duplicate.tokens
            });
          });
        }
      } catch (error) {
        console.error(`Error parsing jscpd report: ${error.message}`);
      }
    } else {
      console.warn(`jscpd report not found at ${reportPath}`);
    }
    
    // Find similar code patterns
    const similarCodePatterns = await findSimilarCodePatterns(baseDir);
    
    return {
      percentage: jscpdResults.percentage,
      exactDuplicates: jscpdResults.exactDuplicates || [],
      similarCode: similarCodePatterns
    };
  } catch (error) {
    console.error(`Error in code duplication analysis: ${error.message}`);
    return {
      percentage: 0,
      exactDuplicates: [],
      similarCode: []
    };
  }
}

// Helper function to find similar code patterns
async function findSimilarCodePatterns(baseDir) {
  // This is a similarity detection implementation using string-similarity
  // if available, otherwise falling back to a simple name-based approach
  const similarPatterns = [];
  
  try {
    // Get all source files recursively
    const sourceFiles = [];
    
    function walkDir(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip node_modules and other common excluded directories
          if (entry.name === 'node_modules' || entry.name === '.git' || 
              entry.name === 'dist' || entry.name === 'build') {
            continue;
          }
          walkDir(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
            sourceFiles.push(fullPath);
          }
        }
      }
    }
    
    walkDir(baseDir);
    
    // If we have string-similarity, use it for more advanced detection
    if (stringSimilarity && stringSimilarity.compareTwoStrings) {
      console.log('Using string-similarity for content similarity detection');
      
      // Take a subset of files to analyze (to prevent overwhelming resources)
      const filesToAnalyze = sourceFiles.slice(0, 100); 
      const similarFiles = [];
      
      // Load content of files to compare
      const fileContents = {};
      filesToAnalyze.forEach(file => {
        try {
          fileContents[file] = fs.readFileSync(file, 'utf8');
        } catch (error) {
          console.error(`Error reading file ${file}: ${error.message}`);
        }
      });
      
      // Compare each file with every other file
      for (let i = 0; i < filesToAnalyze.length; i++) {
        const file1 = filesToAnalyze[i];
        const content1 = fileContents[file1];
        
        if (!content1) continue;
        
        for (let j = i + 1; j < filesToAnalyze.length; j++) {
          const file2 = filesToAnalyze[j];
          const content2 = fileContents[file2];
          
          if (!content2) continue;
          
          // Calculate similarity between two files
          const similarity = stringSimilarity.compareTwoStrings(content1, content2);
          
          // If similarity is above threshold, add to results
          if (similarity > 0.7) {
            similarFiles.push({
              file1: file1,
              file2: file2,
              similarity: similarity
            });
          }
        }
      }
      
      // Format results
      if (similarFiles.length > 0) {
        similarFiles.forEach(result => {
          similarPatterns.push({
            pattern: 'content-similarity',
            files: [result.file1, result.file2],
            similarity: result.similarity.toFixed(2),
            count: 2
          });
        });
        
        return similarPatterns;
      }
    }
    
    // Fallback to simpler name-based approach
    console.log('Fallback to name-based similarity detection');
    
    // Group files by similar base names (ignoring extensions and directory)
    const fileGroups = {};
    
    sourceFiles.forEach(file => {
      const baseName = path.basename(file, path.extname(file));
      
      // Remove common prefixes/suffixes like 'index', 'App', 'Component'
      let normalizedName = baseName
        .replace(/index$|Index$|Component$|Helper$|Util$|Utils$/, '')
        .toLowerCase();
      
      if (normalizedName) {
        fileGroups[normalizedName] = fileGroups[normalizedName] || [];
        fileGroups[normalizedName].push(file);
      }
    });
    
    // Filter groups with more than one file (indicating potential similarity)
    Object.keys(fileGroups).forEach(groupName => {
      if (fileGroups[groupName].length > 1) {
        similarPatterns.push({
          pattern: groupName,
          files: fileGroups[groupName],
          count: fileGroups[groupName].length
        });
      }
    });
    
    return similarPatterns;
  } catch (error) {
    console.error(`Error finding similar code patterns: ${error.message}`);
    return [];
  }
}