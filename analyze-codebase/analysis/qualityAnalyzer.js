// analysis/qualityAnalyzer.js
/* eslint-env node, es2021 */
/* global console */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { outputDir } from '../outputPath.js';

// Get the current file path and directory - needed for relative path calculations
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function analyzeCodeQuality(sourceFiles) {
  console.log('Analyzing code quality...');
  
  // Initialize complexity analyzer
  let complexityReport;
  try {
    complexityReport = (await import('complexity-report')).default;
    console.log('Successfully loaded complexity-report module');
  } catch (error) {
    console.error(`Error importing complexity-report: ${error.message}`);
    console.error('Please install dependencies: npm install complexity-report');
    complexityReport = null;
  }
  
  // Filter JavaScript and TypeScript files
  const jsFiles = sourceFiles.filter(file => 
    file.endsWith('.js') || 
    file.endsWith('.jsx') || 
    file.endsWith('.ts') || 
    file.endsWith('.tsx')
  );
  
  // Prepare results
  const results = {
    complexity: [],
    linting: []
  };
  
  // Analyze complexity for each file
  for (const file of jsFiles) {
    try {
      const code = fs.readFileSync(file, 'utf8');
      const relPath = path.relative(path.resolve(__dirname, '../../'), file);
      
      try {
        let complexity;
        
        // Try to use the complexity-report module if available
        if (complexityReport && typeof complexityReport.run === 'function' && file.endsWith('.js')) {
          try {
            const report = complexityReport.run(code, { filename: relPath });
            complexity = {
              file: relPath,
              complexity: report.maintainability || 0,
              cyclomatic: report.aggregate?.cyclomatic || 0,
              sloc: report.aggregate?.sloc?.physical || 0,
              functions: report.functions?.length || 0,
              maintainability: report.maintainability || 0
            };
          } catch (complexityError) {
            // If complexity-report fails, fall back to our custom calculator
            console.log(`Complexity module failed for ${relPath}: ${complexityError.message}. Using custom calculator.`);
            complexity = calculateComplexity(code, { file: relPath });
          }
        } else {
          // Use our custom complexity calculator for non-JS files or if module isn't available
          complexity = calculateComplexity(code, { file: relPath });
        }
        
        results.complexity.push(complexity);
      } catch (analyzeError) {
        console.error(`Error analyzing complexity for ${relPath}: ${analyzeError.message}`);
        results.complexity.push({
          file: relPath,
          error: analyzeError.message
        });
      }
    } catch (readError) {
      console.error(`Error reading file ${file}: ${readError.message}`);
    }
  }
  
  // Run ESLint for code quality issues
  try {
    // Check if ESLint is available
    try {
      execSync('npx eslint --version', { stdio: 'ignore' });
    } catch (eslintCheckError) {
      console.warn(`ESLint not available: ${eslintCheckError.message}. Skipping linting analysis.`);
      return results;
    }
    
    // Create temp file with list of files to analyze
    const tempFilePath = path.join(outputDir, 'temp-filelist.txt');
    fs.writeFileSync(tempFilePath, jsFiles.join('\n'));
    
    // Run ESLint with JSON formatter
    const outputPath = path.join(outputDir, 'eslint-report.json');
    
    try {
      execSync(
        `npx eslint --no-ignore --format json --output-file "${outputPath}" --fix-dry-run $(cat "${tempFilePath}")`, 
        { stdio: 'pipe' }
      );
    } catch (eslintRunError) {
      // ESLint exits with error if issues are found, but we still want to parse the output
      console.log(`ESLint found issues (expected behavior). Exit code: ${eslintRunError.status}`);
    }
    
    // Read and parse the ESLint results
    if (fs.existsSync(outputPath)) {
      const lintResults = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      
      // Transform ESLint results to our format
      lintResults.forEach(fileResult => {
        const relPath = path.relative(path.resolve(__dirname, '../../'), fileResult.filePath);
        
        fileResult.messages.forEach(message => {
          results.linting.push({
            file: relPath,
            line: message.line,
            column: message.column,
            severity: message.severity,
            message: message.message,
            ruleId: message.ruleId
          });
        });
      });
    }
    
    // Clean up temp file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  } catch (lintingError) {
    console.error(`Error running ESLint: ${lintingError.message}`);
  }
  
  return results;
}

// Helper function to calculate complexity for all file types
function calculateComplexity(code, options) {
  const file = options.file || 'unknown';
  const lines = code.split('\n').length;
  
  // Count certain patterns as indicators of complexity
  const conditionals = (code.match(/if\s*\(/g) || []).length;
  const loops = (code.match(/for\s*\(/g) || []).length + 
                (code.match(/while\s*\(/g) || []).length;
  const functions = (code.match(/function\s+\w+\s*\(/g) || []).length + 
                   (code.match(/\w+\s*=\s*function\s*\(/g) || []).length + 
                   (code.match(/\w+\s*\([^)]*\)\s*=>/g) || []).length;
  
  // Calculate cyclomatic complexity (simplified)
  const cyclomatic = 1 + conditionals + loops;
  
  // Calculate maintainability index (simplified)
  // Formula based on Microsoft's maintainability index
  const volume = lines * Math.log(Math.max(1, functions + conditionals + loops));
  const maintainability = Math.max(0, 171 - 5.2 * Math.log(Math.max(1, volume)) - 0.23 * cyclomatic - 16.2 * Math.log(Math.max(2, lines)));
  
  return {
    file,
    complexity: maintainability,
    cyclomatic,
    sloc: lines,
    functions,
    maintainability
  };
}