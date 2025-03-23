// visualization/visualizer.js
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

// Get the current file path and directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function generateVisualization(analysisData, outputDir) {
  // Generate dependency graph visualization
  const dependencyData = transformDependencyData(analysisData.dependencies?.graph || {});
  
  const d3Template = fs.readFileSync(
    path.join(__dirname, 'templates/dependency-graph.html'),
    'utf8'
  );
  
  fs.writeFileSync(
    path.join(outputDir, 'dependency-graph.html'),
    d3Template.replace('__DATA__', JSON.stringify(dependencyData))
  );
  
  // Generate complexity heatmap
  const complexityData = transformComplexityData(analysisData.quality?.complexity || []);
  
  const heatmapTemplate = fs.readFileSync(
    path.join(__dirname, 'templates/complexity-heatmap.html'),
    'utf8'
  );
  
  fs.writeFileSync(
    path.join(outputDir, 'complexity-heatmap.html'),
    heatmapTemplate.replace('__DATA__', JSON.stringify(complexityData))
  );
  
  // Generate main dashboard
  generateDashboard(analysisData, outputDir);
}

// Helper function to transform dependency data for D3
function transformDependencyData(graph) {
  const nodes = [];
  const links = [];
  
  // Process the dependency graph to create D3-compatible format
  Object.keys(graph).forEach((file, index) => {
    // Add node for this file
    nodes.push({
      id: file,
      index: index,
      name: path.basename(file),
      group: file.includes('src/components') ? 1 : 
             file.includes('src/utils') ? 2 :
             file.includes('src/lib') ? 3 : 4
    });
    
    // Add links for dependencies
    if (Array.isArray(graph[file])) {
      graph[file].forEach(dep => {
        links.push({
          source: file,
          target: dep,
          value: 1
        });
      });
    }
  });
  
  return { nodes, links };
}

// Helper function to transform complexity data for heatmap
function transformComplexityData(complexityData) {
  // Transform complexity metrics into heatmap format
  return complexityData.map(item => {
    const fileName = item.file ? path.basename(item.file) : 'unknown';
    const complexity = typeof item.complexity === 'number' ? item.complexity : 
                      (item.cyclomatic || item.maintainability || 0);
                      
    return {
      name: fileName,
      value: complexity,
      category: complexity < 5 ? 'Low' : 
               complexity < 10 ? 'Medium' : 
               complexity < 20 ? 'High' : 'Very High'
    };
  }).sort((a, b) => b.value - a.value); // Sort by complexity descending
}

function generateDashboard(analysisData, outputDir) {
  // Create main index.html with all visualizations embedded
  const dashboardTemplate = fs.readFileSync(
    path.join(__dirname, 'templates/dashboard.html'),
    'utf8'
  );
  
  // Transform data for dashboard charts
  const metrics = {
    codebase: {
      files: analysisData.totalFiles,
      lines: analysisData.totalLines,
      size: formatBytes(analysisData.totalSize)
    },
    quality: {
      errors: countErrors(analysisData.quality?.linting),
      warnings: countWarnings(analysisData.quality?.linting),
      complexity: calculateAverageComplexity(analysisData.quality?.complexity)
    },
    duplication: {
      percentage: analysisData.duplication?.percentage || 0,
      files: (analysisData.duplication?.exactDuplicates || []).length,
      similar: (analysisData.duplication?.similarCode || []).length
    },
    dependencies: {
      circular: (analysisData.dependencies?.circular || []).length,
      external: Object.keys(analysisData.dependencies?.external || {}).length
    }
  };
  
  fs.writeFileSync(
    path.join(outputDir, 'index.html'),
    dashboardTemplate.replace('__METRICS__', JSON.stringify(metrics))
  );
}

// Helper functions for metrics calculation
function formatBytes(bytes) {
  if (!bytes) {
    return '0 B';
  }
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

function countErrors(linting) {
  if (!linting || !Array.isArray(linting)) {
    return 0;
  }
  return linting.filter(issue => issue.severity === 2).length;
}

function countWarnings(linting) {
  if (!linting || !Array.isArray(linting)) {
    return 0;
  }
  return linting.filter(issue => issue.severity === 1).length;
}

function calculateAverageComplexity(complexity) {
  if (!complexity || !Array.isArray(complexity) || complexity.length === 0) {
    return 0;
  }
  const sum = complexity.reduce((acc, item) => acc + (item.complexity || 0), 0);
  return (sum / complexity.length).toFixed(2);
}