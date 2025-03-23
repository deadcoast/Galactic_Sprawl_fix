# Galactic Sprawl Codebase Analyzer

A comprehensive suite of tools for analyzing the Galactic Sprawl codebase structure, identifying code duplication, and providing recommendations for improvement.

## Features

- **Codebase Structure Analysis**: Maps the project structure and identifies organizational patterns
- **Code Duplication Detection**: Finds identical and similar code across the project
- **Dependency Analysis**: Analyzes module dependencies and identifies circular dependencies
- **Quality Metrics**: Measures code complexity, maintainability, and linting issues
- **React Component Analysis**: Analyzes React component structure and patterns
- **Git History Insights**: Provides insights based on commit history and contribution patterns
- **Interactive Visualizations**: Generates visual representations of analysis results

## Installation

This tool has its own dedicated dependencies separate from the main Galactic Sprawl project. To set up:

```bash
# Navigate to the analyze-codebase directory
cd analyze-codebase

# Install dependencies
npm install
```

### Required Dependencies

This tool relies on the following key dependencies:

- **@babel/parser & @babel/traverse**: For React component analysis
- **jscpd**: For code duplication detection 
- **escomplex**: For code complexity measurement
- **madge**: For dependency analysis
- **git**: For code history analysis

## Usage

The analyzer provides several commands for different analysis operations:

### Run Full Analysis

```bash
# Run the complete analysis suite
npm run analyze
```

This will:
1. Scan the codebase for structure and duplication
2. Analyze code quality and dependencies
3. Generate a comprehensive technical report
4. Create visualizations of the results

### Generate Reports Only

If you've already run the analysis and just want to regenerate the reports:

```bash
npm run report
```

### Consolidate Duplicated Files

After reviewing the analysis, you can use this command to consolidate duplicated components:

```bash
npm run consolidate
```

This will:
1. Create a shared components directory
2. Move duplicated files to the shared location
3. Update imports throughout the codebase
4. Generate an import update report

### Show Help

To display information about available commands:

```bash
npm run help
```

## Output

After running the analysis, you'll find the following outputs in the `output` directory:

- `codebase_analysis_report.json`: Raw analysis data in JSON format
- `TECHNICAL_REPORT.md`: Comprehensive markdown report with findings and recommendations
- `dependency-graph.html`: Interactive visualization of module dependencies
- `complexity-heatmap.html`: Visualization of code complexity across the codebase
- `index.html`: Dashboard with all visualizations and key metrics
- `duplication-report/`: Detailed reports on code duplication
- `eslint-report.json`: Code quality issues from ESLint analysis

## Architecture

The analyzer has a modular architecture with these key components:

1. **Core Scripts**
   - `main.js`: Entry point for all operations
   - `analyze.js`: Main analysis functionality
   - `consolidate.js`: Duplicate code consolidation
   - `analyze.sh`: Shell wrapper for easier execution

2. **Analysis Modules**
   - `analysis/duplicateAnalyzer.js`: Detects code duplication
   - `analysis/dependencyAnalyzer.js`: Analyzes code dependencies
   - `analysis/historyAnalyzer.js`: Examines code history using git
   - `analysis/qualityAnalyzer.js`: Evaluates code quality metrics
   - `analysis/reactAnalyzer.js`: Analyzes React component structure

3. **Reporting & Visualization**
   - `reporting/generateReport.js`: Creates technical reports
   - `visualization/visualizer.js`: Generates visualizations

## Relationship to Main Project

This tool is designed to analyze the main Galactic Sprawl project but operates as a standalone utility with its own dependencies. It reads the main project's codebase but does not modify it unless explicitly instructed to do so with the `consolidate` command.

## Troubleshooting

### Missing Dependencies

If you encounter errors about missing dependencies, ensure you've installed all required packages:

```bash
npm install
```

### Git Analysis Errors

If git analysis fails, make sure:
1. Git is installed and available in your PATH
2. You're running the analysis from within the git repository
3. You have permission to access the git history

### Large Codebase Performance

For very large codebases:
1. The analysis might take several minutes to complete
2. You may need to increase Node.js memory limits: `NODE_OPTIONS=--max-old-space-size=4096 npm run analyze`

## Contributing

Contributions to the analyzer are welcome! To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

Please ensure your code follows the project's coding standards and includes appropriate tests.

## License

This tool is licensed under the MIT License - see the LICENSE file for details.
