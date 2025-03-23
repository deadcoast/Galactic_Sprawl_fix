/* eslint-env node */
/* global console, process */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { outputDir } from '../outputPath.js';

// Mock MarkdownIt implementation
class MarkdownIt {
  render(markdown) {
    // Simple HTML conversion - just wrap in basic HTML tags
    return `<!DOCTYPE html>
<html>
<head>
  <title>Technical Report</title>
  <meta charset="utf-8">
  <style>
    body { font-family: system-ui, sans-serif; max-width: 900px; margin: 0 auto; padding: 2rem; line-height: 1.5; }
    h1, h2, h3 { margin-top: 2rem; }
    pre { background: #f5f5f5; padding: 1rem; overflow-x: auto; }
    code { font-family: monospace; }
  </style>
</head>
<body>
  ${markdown.replace(/\n/g, '<br>')
            .replace(/^# (.*)/gm, '<h1>$1</h1>')
            .replace(/^## (.*)/gm, '<h2>$1</h2>')
            .replace(/^### (.*)/gm, '<h3>$1</h3>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')}
</body>
</html>`;
  }
}

// Get the current file path and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use the shared outputDir from outputPath.js which points to the dated output directory
// const outputDir = path.join(__dirname, '..', 'output');  // Old path

// Load the analysis report
const reportPath = path.join(outputDir, 'codebase_analysis_report.json');
let reportData;

try {
  console.log(`Reading analysis report from: ${reportPath}`);
  const reportContent = fs.readFileSync(reportPath, 'utf8');
  reportData = JSON.parse(reportContent);
} catch (err) {
  console.error(`Error reading analysis report: ${err.message}`);
  console.error('Please run analyze.js first to generate the report.');
  
  // Try to find report in the latest directory as fallback
  const latestDir = path.join(path.dirname(outputDir), 'latest');
  if (fs.existsSync(latestDir)) {
    const latestReportPath = path.join(latestDir, 'codebase_analysis_report.json');
    console.log(`Trying latest report at: ${latestReportPath}`);
    if (fs.existsSync(latestReportPath)) {
      try {
        const latestContent = fs.readFileSync(latestReportPath, 'utf8');
        reportData = JSON.parse(latestContent);
        console.log(`Successfully read report from latest directory`);
      } catch (latestErr) {
        console.error(`Error reading from latest directory: ${latestErr.message}`);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  } else {
    process.exit(1);
  }
}

// Load the report template
const templatePath = path.join(__dirname, '..', 'report_template.md');
let templateContent;

try {
  templateContent = fs.readFileSync(templatePath, 'utf8');
} catch (err) {
  console.error(`Error reading report template: ${err.message}`);
  process.exit(1);
}

// Generate detailed sections
function generateIdenticalFilesDetails() {
  const identicalFiles = reportData.identicalFiles || {};
  const identicalFilesCount = Object.keys(identicalFiles).length;
  
  if (identicalFilesCount === 0) {
    return "No files with identical content were found.";
  }
  
  let details = "The following files have identical implementations and should be consolidated:\n\n";
  
  for (const [hash, files] of Object.entries(identicalFiles)) {
    if (files.length < 2) {
      continue;
    }
    
    details += `- Files with hash ${hash.slice(0, 8)}:\n`;
    files.forEach(file => {
      details += `  - \`${file}\`\n`;
    });
    details += "\n";
  }
  
  return details;
}

function generateSimilarFilesDetails() {
  const similarFiles = reportData.similarFiles || {};
  // Filter out index.ts files as they're expected to have the same name
  const filteredSimilarFiles = {};
  for (const [name, files] of Object.entries(similarFiles)) {
    if (name !== 'index' && name !== 'index.ts') {
      filteredSimilarFiles[name] = files;
    }
  }
  
  const similarFilesCount = Object.keys(filteredSimilarFiles).length;
  
  if (similarFilesCount === 0) {
    return "No files with similar names but different content were found.";
  }
  
  let details = "Several components have multiple implementations:\n\n";
  
  // Group similar files by type for a more organized report
  const uiComponents = [];
  const serviceFiles = [];
  const typeFiles = [];
  const utilityFiles = [];
  const otherFiles = [];
  
  for (const [name, files] of Object.entries(filteredSimilarFiles)) {
    if (files.length < 2) {
      continue;
    }
    
    const item = {
      name,
      count: files.length,
      files
    };
    
    if (name.endsWith('.tsx') || name.includes('Button') || name.includes('Card') || name.includes('Badge')) {
      uiComponents.push(item);
    } else if (name.includes('Manager') || name.includes('Service') || name.includes('Registry')) {
      serviceFiles.push(item);
    } else if (name.includes('Type') || name.includes('Interface')) {
      typeFiles.push(item);
    } else if (name.includes('util') || name.includes('helper') || name.endsWith('.ts')) {
      utilityFiles.push(item);
    } else {
      otherFiles.push(item);
    }
  }
  
  if (uiComponents.length > 0) {
    details += "### UI Components\n\n";
    uiComponents.forEach(item => {
      details += `- \`${item.name}\` (${item.count} implementations):\n`;
      item.files.forEach(file => {
        details += `  - \`${file}\`\n`;
      });
      details += "\n";
    });
  }
  
  if (serviceFiles.length > 0) {
    details += "### Service/Manager Files\n\n";
    serviceFiles.forEach(item => {
      details += `- \`${item.name}\` (${item.count} implementations):\n`;
      item.files.forEach(file => {
        details += `  - \`${file}\`\n`;
      });
      details += "\n";
    });
  }
  
  if (typeFiles.length > 0) {
    details += "### Type Definitions\n\n";
    typeFiles.forEach(item => {
      details += `- \`${item.name}\` (${item.count} implementations):\n`;
      item.files.forEach(file => {
        details += `  - \`${file}\`\n`;
      });
      details += "\n";
    });
  }
  
  if (utilityFiles.length > 0) {
    details += "### Utility Functions\n\n";
    utilityFiles.forEach(item => {
      details += `- \`${item.name}\` (${item.count} implementations):\n`;
      item.files.forEach(file => {
        details += `  - \`${file}\`\n`;
      });
      details += "\n";
    });
  }
  
  if (otherFiles.length > 0) {
    details += "### Other Files\n\n";
    otherFiles.forEach(item => {
      details += `- \`${item.name}\` (${item.count} implementations):\n`;
      item.files.forEach(file => {
        details += `  - \`${file}\`\n`;
      });
      details += "\n";
    });
  }
  
  return details;
}

function generateEmptyFilesDetails() {
  const emptyFiles = reportData.emptyFiles || [];
  
  if (emptyFiles.length === 0) {
    return "No empty files were found.";
  }
  
  let details = "The following files are empty or contain only whitespace:\n\n";
  
  emptyFiles.forEach(file => {
    details += `- \`${file}\`\n`;
  });
  
  return details;
}

export async function generateEnhancedReport(analysisData, outputDir) {
  const md = new MarkdownIt();
  let report = `# ${analysisData.projectName} Technical Structure Report - Enhanced Edition\n\n`;
  
  // Add executive summary
  report += `## Executive Summary\n\n`;
  report += generateExecutiveSummary(analysisData);
  
  // Add code quality analysis
  report += `\n## Code Quality Analysis\n\n`;
  report += generateQualitySection(analysisData);
  
  // Add architecture analysis
  report += `\n## Architecture Analysis\n\n`;
  report += generateArchitectureSection(analysisData);
  
  // Add duplication analysis
  report += `\n## Duplication Analysis\n\n`;
  report += generateDuplicationSection(analysisData);
  
  // Add performance analysis
  report += `\n## Performance Analysis\n\n`;
  report += generatePerformanceSection(analysisData);
  
  // Add historical analysis
  report += `\n## Historical Analysis\n\n`;
  report += generateHistoricalSection(analysisData);
  
  // Add recommendations
  report += `\n## Prioritized Recommendations\n\n`;
  report += generateRecommendations(analysisData);
  
  // Add embedded visualizations
  report += `\n## Interactive Visualizations\n\n`;
  report += `The following interactive visualizations are available in the output directory:\n\n`;
  report += `- [Dependency Graph](./dependency-graph.html)\n`;
  report += `- [Complexity Heatmap](./complexity-heatmap.html)\n`;
  report += `- [Main Dashboard](./index.html)\n`;
  
  // Write the report
  fs.writeFileSync(path.join(outputDir, 'ENHANCED_TECHNICAL_REPORT.md'), report);
  
  // Generate HTML version with embedded charts
  const html = md.render(report);
  fs.writeFileSync(path.join(outputDir, 'ENHANCED_TECHNICAL_REPORT.html'), html);
  
  return {
    reportPath: path.join(outputDir, 'ENHANCED_TECHNICAL_REPORT.md'),
    htmlPath: path.join(outputDir, 'ENHANCED_TECHNICAL_REPORT.html')
  };
}

function generateExecutiveSummary(analysisData) {
  // Use existing data from the base report
  return `This report provides an enhanced analysis of the ${analysisData.projectName} codebase structure, organization, and potential areas for improvement. The analysis covers code quality, architecture, duplication, performance, and historical trends.

Total Files: ${analysisData.totalFiles}
Total Directories: ${analysisData.totalDirectories}
Total Lines of Code: ${analysisData.totalLines.toLocaleString()}
Total Size: ${(analysisData.totalSize / 1024 / 1024).toFixed(2)}MB
`;
}

function generateQualitySection(analysisData) {
  if (!analysisData.quality) {
    return "Quality analysis data not available. Run with quality analyzer enabled.";
  }
  
  return `### Linting Issues

${analysisData.quality.linting ? `Found ${analysisData.quality.linting.length} linting issues.` : 'No linting data available.'}

### Code Complexity

${analysisData.quality.complexity ? `Analyzed complexity metrics for ${analysisData.quality.complexity.length} files.` : 'No complexity data available.'}
`;
}

function generateArchitectureSection(analysisData) {
  if (!analysisData.dependencies) {
    return "Dependency analysis data not available. Run with dependency analyzer enabled.";
  }
  
  const circularDeps = analysisData.dependencies.circular || [];
  
  return `### Directory Structure

The codebase is organized into ${analysisData.totalDirectories} directories with a total of ${analysisData.totalFiles} files.

### Dependency Structure

${circularDeps.length > 0 ? `Found ${circularDeps.length} circular dependencies.` : 'No circular dependencies detected.'}
`;
}

function generateDuplicationSection(analysisData) {
  return `### Identical Files

Found ${Object.keys(analysisData.identicalFiles || {}).length} sets of identical files that should be consolidated.

### Similar Files

Found ${Object.keys(analysisData.similarFiles || {}).length} sets of similarly named files that may contain duplicate functionality.
`;
}

function generatePerformanceSection(analysisData) {
  if (!analysisData.performance) {
    return "Performance analysis data not available. Run with performance analyzer enabled.";
  }
  
  return `### Bundle Size

Estimated production bundle size: ${analysisData.performance?.bundleSize || 'Not analyzed'}

### Component Rendering Performance

${analysisData.performance?.slowComponents ? `Identified ${analysisData.performance.slowComponents.length} potentially slow components.` : 'No component performance data available.'}
`;
}

function generateHistoricalSection(analysisData) {
  if (!analysisData.history) {
    return "Historical analysis data not available. Run with history analyzer enabled.";
  }
  
  return `### Code Growth

${analysisData.history.codeGrowth ? `Analyzed code growth over the past ${analysisData.history.codeGrowth.length} periods.` : 'No code growth data available.'}

### Change Frequency

${analysisData.history.changeFrequency ? `Analyzed change frequency for ${analysisData.history.changeFrequency.length} files.` : 'No change frequency data available.'}
`;
}

function generateRecommendations(analysisData) {
  return `Based on the analysis, the following recommendations are prioritized:

1. **Consolidate Duplicated Files**: Merge the ${Object.keys(analysisData.identicalFiles || {}).length} sets of identical files.
2. **Review Similar Implementations**: Examine the ${Object.keys(analysisData.similarFiles || {}).length} sets of similarly named files.
3. **Clean Up Empty Files**: Either implement or remove the ${analysisData.emptyFiles?.length || 0} empty files.
${analysisData.dependencies?.circular?.length > 0 ? `4. **Resolve Circular Dependencies**: Fix the ${analysisData.dependencies.circular.length} circular dependencies.` : ''}
${analysisData.quality?.linting?.length > 0 ? `5. **Fix Linting Issues**: Address the ${analysisData.quality.linting.length} linting issues.` : ''}

The most critical files to address first are:
${Object.values(analysisData.identicalFiles || {}).slice(0, 3).map(files => `- ${files[0]} (duplicated ${files.length - 1} times)`).join('\n')}
`;
}

// Fill in the template
function generateReport() {
  const identicalFiles = reportData.identicalFiles || {};
  const identicalFilesCount = Object.keys(identicalFiles).length;
  
  const similarFiles = reportData.similarFiles || {};
  // Filter out index.ts files as they're expected to have the same name
  const filteredSimilarFiles = {};
  for (const [name, files] of Object.entries(similarFiles)) {
    if (name !== 'index' && name !== 'index.ts') {
      filteredSimilarFiles[name] = files;
    }
  }
  const similarFilesCount = Object.keys(filteredSimilarFiles).length;
  
  const emptyFiles = reportData.emptyFiles || [];
  const emptyFilesCount = emptyFiles.length;
  
  // Replace placeholders
  let reportContent = templateContent
    .replace(/{{IDENTICAL_FILES_COUNT}}/g, identicalFilesCount.toString())
    .replace(/{{SIMILAR_FILES_COUNT}}/g, similarFilesCount.toString())
    .replace(/{{EMPTY_FILES_COUNT}}/g, emptyFilesCount.toString())
    .replace(/{{IDENTICAL_FILES_DETAILS}}/g, generateIdenticalFilesDetails())
    .replace(/{{SIMILAR_FILES_DETAILS}}/g, generateSimilarFilesDetails())
    .replace(/{{EMPTY_FILES_DETAILS}}/g, generateEmptyFilesDetails())
    .replace(/{{GENERATION_DATE}}/g, new Date().toDateString());
  
  // Write the final report
  const finalReportPath = path.join(outputDir, 'TECHNICAL_REPORT.md');
  fs.writeFileSync(finalReportPath, reportContent);
  
  // Also write a copy to the project root for convenience
  const rootReportPath = path.join(__dirname, '..', 'TECHNICAL_REPORT.md');
  fs.writeFileSync(rootReportPath, reportContent);
  
  console.log(`Generated technical report at ${finalReportPath}`);
  console.log(`Also placed a copy at ${rootReportPath}`);
}

// Run the report generation
generateReport();
