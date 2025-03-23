#!/usr/bin/env node
/* eslint-env node */
/* global console, process */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get the current file path and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseOutputDir = path.join(__dirname, 'output');

// Create a dated folder for this analysis run
function getFormattedDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

// Create dated output directory
const dateFolderName = getFormattedDate();
const outputDir = path.join(baseOutputDir, dateFolderName);

// Ensure base output directory exists
if (!fs.existsSync(baseOutputDir)) {
  fs.mkdirSync(baseOutputDir, { recursive: true });
}

// Ensure dated output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create exports file to share the output directory path with other modules
const exportsFilePath = path.join(__dirname, 'outputPath.js');
fs.writeFileSync(
  exportsFilePath,
  `export const outputDir = '${outputDir}';\n`
);

// Create a 'latest' symbolic link to the current run
const latestLinkPath = path.join(baseOutputDir, 'latest');
console.log(`Creating/updating 'latest' link to point to ${dateFolderName}`);

// More robust approach to handle symlink creation
function updateLatestSymlink() {
  try {
    // Check if latestLinkPath exists and what type it is
    if (fs.existsSync(latestLinkPath)) {
      const stats = fs.lstatSync(latestLinkPath);
      
      // If it's a symlink, remove it
      if (stats.isSymbolicLink()) {
        fs.unlinkSync(latestLinkPath);
        console.log('Successfully removed existing symlink');
      } 
      // If it's a directory or file, rename it to backup
      else {
        const backupPath = `${latestLinkPath}_backup_${Date.now()}`;
        fs.renameSync(latestLinkPath, backupPath);
        console.log(`Renamed existing file/directory to ${backupPath}`);
      }
    }
    
    // Create new symlink
    fs.symlinkSync(dateFolderName, latestLinkPath, 'dir');
    console.log(`Successfully created 'latest' symlink to ${dateFolderName}`);
    return true;
  } catch (error) {
    console.error(`Error updating symlink: ${error.message}`);
    return false;
  }
}

// Try symlink first, fall back to copy if symlink fails
if (!updateLatestSymlink()) {
  try {
    // Fallback method: create a file that contains the path to the latest run
    fs.writeFileSync(`${baseOutputDir}/latest_run.txt`, dateFolderName);
    console.log(`Created latest_run.txt with path to current analysis: ${dateFolderName}`);
    
    // Also copy key files to a 'latest' directory if symlink failed
    const latestDirPath = path.join(baseOutputDir, 'latest_copy');
    if (!fs.existsSync(latestDirPath)) {
      fs.mkdirSync(latestDirPath, { recursive: true });
    }

    // We'll populate this directory later in the process after files are generated
    console.log(`Created latest_copy directory as fallback`);
  } catch (copyError) {
    console.error(`Failed to create fallback 'latest' references: ${copyError.message}`);
  }
}

// Display help message
function showHelp() {
  console.log(`
Galactic Sprawl Codebase Analysis Tool

Usage:
  node main.js [command]

Commands:
  analyze    Run full codebase analysis (default if no command provided)
  report     Generate the technical report from existing analysis
  consolidate Consolidate duplicate files into shared components
  help       Show this help message

Examples:
  node main.js analyze      # Analyze the codebase and generate reports
  node main.js report       # Generate reports from existing analysis data
  node main.js consolidate  # Consolidate duplicated components
  `);
}

// Helper function to copy key files to the latest_copy directory
function copyLatestResults() {
  const latestCopyDir = path.join(baseOutputDir, 'latest_copy');
  if (!fs.existsSync(latestCopyDir)) {
    fs.mkdirSync(latestCopyDir, { recursive: true });
  }
  
  // Clear any existing files
  fs.readdirSync(latestCopyDir).forEach(file => {
    const filePath = path.join(latestCopyDir, file);
    if (fs.lstatSync(filePath).isFile()) {
      fs.unlinkSync(filePath);
    }
  });
  
  // List of key files to copy
  const keyFiles = [
    'TECHNICAL_REPORT.md',
    'index.html',
    'dependency-graph.html',
    'complexity-heatmap.html',
    'codebase_analysis_report.json'
  ];
  
  // Copy each file if it exists
  keyFiles.forEach(file => {
    const sourcePath = path.join(outputDir, file);
    if (fs.existsSync(sourcePath)) {
      const destPath = path.join(latestCopyDir, file);
      fs.copyFileSync(sourcePath, destPath);
      console.log(`Copied ${file} to latest_copy directory`);
    }
  });
}

// Add color console output support
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m"
};

function logSuccess(message) {
  console.log(`${colors.green}SUCCESS: ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}ERROR: ${message}${colors.reset}`);
}

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
function logWarning(message) {
  console.log(`${colors.yellow}WARNING: ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.blue}INFO: ${message}${colors.reset}`);
}

// Make sure to properly generate dependency graph
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
function generateDependencyGraph(dependencies, outputDir) {
  try {
    logInfo("Generating dependency graph visualization...");
    
    // Create the dependencies.json file for visualization
    const dependencyData = {
      directDependencies: dependencies.directDependencies || {},
      devDependencies: dependencies.devDependencies || {},
      peerDependencies: dependencies.peerDependencies || {},
      outdated: dependencies.outdated || []
    };
    
    // Save the dependency data as JSON
    fs.writeFileSync(
      path.join(outputDir, 'dependencies.json'), 
      JSON.stringify(dependencyData, null, 2)
    );
    
    // Create a visualization-friendly format
    const nodes = [];
    const links = [];
    
    // Add direct dependencies as nodes
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    Object.entries(dependencies.directDependencies || {}).forEach(([name, version], index) => {
      nodes.push({
        id: name,
        name: name,
        version: version,
        type: 'direct',
        size: 10
      });
      
      // Add link to the central project node
      links.push({
        source: 'project',
        target: name,
        type: 'direct'
      });
    });
    
    // Add dev dependencies
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    Object.entries(dependencies.devDependencies || {}).forEach(([name, version], index) => {
      nodes.push({
        id: name,
        name: name,
        version: version,
        type: 'dev',
        size: 8
      });
      
      links.push({
        source: 'project',
        target: name,
        type: 'dev'
      });
    });
    
    // Add the central project node
    nodes.unshift({
      id: 'project',
      name: 'Project',
      type: 'project',
      size: 15
    });
    
    // Create a graph data structure
    const graphData = {
      nodes: nodes,
      links: links
    };
    
    // Save the graph data
    fs.writeFileSync(
      path.join(outputDir, 'dependency-graph.json'),
      JSON.stringify(graphData, null, 2)
    );
    
    // Create a simple HTML visualization
    const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Dependency Graph</title>
      <script src="https://d3js.org/d3.v7.min.js"></script>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; }
        svg { width: 100%; height: 800px; }
        .node circle { stroke: #fff; stroke-width: 1.5px; }
        .node text { font-size: 10px; }
        .link { stroke: #999; stroke-opacity: 0.6; stroke-width: 1px; }
        .direct { stroke: #1f77b4; }
        .dev { stroke: #2ca02c; }
        .project-node { fill: #ff7f0e; }
        .direct-node { fill: #1f77b4; }
        .dev-node { fill: #2ca02c; }
      </style>
    </head>
    <body>
      <div id="graph"></div>
      <script>
        // Load the data
        const data = ${JSON.stringify(graphData)};
        
        // Create a force simulation
        const simulation = d3.forceSimulation(data.nodes)
          .force("link", d3.forceLink(data.links).id(d => d.id).distance(100))
          .force("charge", d3.forceManyBody().strength(-200))
          .force("center", d3.forceCenter(window.innerWidth / 2, 400));
        
        // Create the SVG container
        const svg = d3.select("#graph")
          .append("svg")
          .attr("viewBox", [0, 0, window.innerWidth, 800]);
        
        // Add links
        const link = svg.append("g")
          .selectAll("line")
          .data(data.links)
          .join("line")
          .attr("class", d => \`link \${d.type}\`);
        
        // Add nodes
        const node = svg.append("g")
          .selectAll(".node")
          .data(data.nodes)
          .join("g")
          .attr("class", "node")
          .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));
        
        // Add circles to nodes
        node.append("circle")
          .attr("r", d => d.size)
          .attr("class", d => \`\${d.type}-node\`);
        
        // Add labels to nodes
        node.append("text")
          .attr("dy", "0.35em")
          .attr("dx", d => d.size + 5)
          .text(d => d.name);
        
        // Update positions on tick
        simulation.on("tick", () => {
          link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
          
          node.attr("transform", d => \`translate(\${d.x},\${d.y})\`);
        });
        
        // Drag functions
        function dragstarted(event, d) {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        }
        
        function dragged(event, d) {
          d.fx = event.x;
          d.fy = event.y;
        }
        
        function dragended(event, d) {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }
      </script>
    </body>
    </html>
    `;
    
    // Save the HTML file
    fs.writeFileSync(
      path.join(outputDir, 'dependency-graph.html'),
      htmlTemplate
    );
    
    logSuccess("Dependency graph visualization created successfully");
    return true;
  } catch (error) {
    logError(`Failed to generate dependency graph: ${error.message}`);
    console.error(error);
    return false;
  }
}

// Add linting results processor to save errors in a structured format
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
function processlintingResults(lintingOutput, outputDir) {
  try {
    logInfo("Processing linting results...");
    
    // Parse the linting output if it's in JSON format
    let lintingData;
    try {
      lintingData = JSON.parse(lintingOutput);
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    } catch (error) {
      // If not JSON, try to parse eslint text output
      lintingData = parseLintingText(lintingOutput);
    }
    
    // Calculate summary statistics
    const summary = {
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
    
    // Process each file result
    if (Array.isArray(lintingData)) {
      lintingData.forEach(fileResult => {
        if (fileResult.messages && fileResult.messages.length > 0) {
          // Get relative file path
          const filePath = fileResult.filePath;
          if (!summary.byFile[filePath]) {
            summary.byFile[filePath] = {
              errors: 0,
              warnings: 0,
              messages: []
            };
          }
          
          // Process each message
          fileResult.messages.forEach(message => {
            // Get rule ID
            const ruleId = message.ruleId || 'unknown';
            if (!summary.byRule[ruleId]) {
              summary.byRule[ruleId] = {
                count: 0,
                errors: 0,
                warnings: 0
              };
            }
            
            // Update counts based on severity
            if (message.severity === 2) {
              summary.totalErrors++;
              summary.byRule[ruleId].errors++;
              summary.byFile[filePath].errors++;
              summary.bySeverity.error++;
            } else if (message.severity === 1) {
              summary.totalWarnings++;
              summary.byRule[ruleId].warnings++;
              summary.byFile[filePath].warnings++;
              summary.bySeverity.warning++;
            } else {
              summary.bySeverity.info++;
            }
            
            summary.byRule[ruleId].count++;
            
            // Add message details
            summary.byFile[filePath].messages.push({
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
    
    // Save the summary data to a file
    fs.writeFileSync(
      path.join(outputDir, 'linting.json'),
      JSON.stringify(summary, null, 2)
    );
    
    // Log the summary
    logInfo(`Linting summary: ${summary.totalErrors} errors, ${summary.totalWarnings} warnings`);
    logSuccess("Linting results processed successfully");
    return summary;
  } catch (error) {
    logError(`Failed to process linting results: ${error.message}`);
    console.error(error);
    return {
      totalErrors: 0,
      totalWarnings: 0,
      byRule: {},
      byFile: {},
      bySeverity: { error: 0, warning: 0, info: 0 }
    };
  }
}

// Placeholder function to parse linting text output (if not JSON)
/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
function parseLintingText(text) {
  // This would be a more complex implementation to parse ESLint's text output
  // For now, just return an empty array
  return [];
}

// Run the analysis
async function runAnalysis() {
  console.log('Starting codebase analysis...');
  
  try {
    execSync('node analyze.js', { 
      cwd: __dirname,
      stdio: 'inherit' 
    });
    
    console.log('\nAnalysis complete! Now generating reports...');
    
    execSync('node reporting/generateReport.js', { 
      cwd: __dirname,
      stdio: 'inherit' 
    });
    
    // Copy key results to latest_copy directory as a backup/fallback
    copyLatestResults();
    
    console.log('\nAnalysis and reporting complete!');
    console.log(`Technical report has been generated at ${path.join(outputDir, 'TECHNICAL_REPORT.md')}`);
    console.log(`A copy has also been placed in the project root directory.`);
    console.log('\nTo consolidate duplicated files, run:');
    console.log('  node main.js consolidate');
  } catch (error) {
    console.error('Error during analysis:', error.message);
    process.exit(1);
  }
}

// Generate reports from existing analysis data
async function generateReports() {
  console.log('Generating reports from existing analysis data...');
  
  const reportDataPath = path.join(outputDir, 'codebase_analysis_report.json');
  
  if (!fs.existsSync(reportDataPath)) {
    console.error(`Analysis data not found at ${reportDataPath}.`);
    console.error('Please run the analysis first with: node main.js analyze');
    process.exit(1);
  }
  
  try {
    execSync('node reporting/generateReport.js', { 
      cwd: __dirname,
      stdio: 'inherit' 
    });
    
    console.log('\nReporting complete!');
    console.log(`Technical report has been generated at ${path.join(outputDir, 'TECHNICAL_REPORT.md')}`);
    console.log(`A copy has also been placed in the project root directory.`);
  } catch (error) {
    console.error('Error generating reports:', error.message);
    process.exit(1);
  }
}

// Consolidate duplicated files
async function consolidateDuplicates() {
  console.log('Consolidating duplicated files...');
  
  const reportDataPath = path.join(outputDir, 'codebase_analysis_report.json');
  
  if (!fs.existsSync(reportDataPath)) {
    console.error(`Analysis data not found at ${reportDataPath}.`);
    console.error('Please run the analysis first with: node main.js analyze');
    process.exit(1);
  }
  
  try {
    execSync('node consolidate.js', { 
      cwd: __dirname,
      stdio: 'inherit' 
    });
    
    console.log('\nConsolidation complete!');
    console.log(`Import update suggestions have been generated at ${path.join(outputDir, 'import_updates.md')}`);
  } catch (error) {
    console.error('Error consolidating duplicates:', error.message);
    process.exit(1);
  }
}

// Main function
async function main() {
  const command = process.argv[2] || 'analyze';
  
  switch (command) {
    case 'analyze':
      await runAnalysis();
      break;
      
    case 'report':
      await generateReports();
      break;
      
    case 'consolidate':
      await consolidateDuplicates();
      break;
      
    case 'help':
      showHelp();
      break;
      
    default:
      console.error(`Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

// Run the program
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
