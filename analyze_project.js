import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Configuration
const PROJECT_ROOT = process.cwd();
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'project_analysis.md');

// Directories to skip
const SKIP_DIRS = [
  'node_modules', '.git', 'dist', 'coverage', '.venv', 
  '.assets', '.vscode', 'test-results', 'playwright-report'
];

// Counter for statistics
const stats = {
  totalFiles: 0,
  scriptFiles: 0,
  styleFiles: 0,
  duplicateFiles: 0,
  emptyFiles: 0,
  maxDepth: 0
};

// Maps for tracking duplicates
const filesByName = new Map();
const filesByContent = new Map();
const emptyFiles = [];

// Function to calculate file hash
function getFileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return {
      hash: crypto.createHash('md5').update(content).digest('hex'),
      size: content.length,
      isEmpty: content.trim().length === 0
    };
  } catch (err) {
    return { hash: null, size: 0, isEmpty: true };
  }
}

// Function to check file type
function getFileType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) return 'script';
  if (['.css', '.scss', '.