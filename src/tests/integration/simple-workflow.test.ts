/**
 * @context: root-directory-organization, simple-workflow-validation
 *
 * Simple integration test to validate basic workflow functionality
 * after root directory reorganization.
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const PROJECT_ROOT = process.cwd();

describe('Simple Workflow Validation', () => {
  it('should have essential files in root directory', () => {
    const essentialFiles = [
      'package.json',
      'index.html',
      'vite.config.ts',
      'eslint.config.js',
      'tsconfig.json',
      '.gitignore',
      'README.md'
    ];

    essentialFiles.forEach(file => {
      const filePath = join(PROJECT_ROOT, file);
      expect(existsSync(filePath), `Essential file ${file} should exist in root`).toBe(true);
    });
  });

  it('should have configuration directories', () => {
    const configDirs = [
      'config',
      'config/build',
      'config/testing',
      'config/linting'
    ];

    configDirs.forEach(dir => {
      const dirPath = join(PROJECT_ROOT, dir);
      expect(existsSync(dirPath), `Configuration directory ${dir} should exist`).toBe(true);
    });
  });

  it('should have moved configuration files', () => {
    const movedFiles = [
      'config/build/.prettierrc.json',
      'config/build/postcss.config.js',
      'config/testing/jest.config.js',
      'config/testing/jest-setup.js',
      'config/linting/eslint_baseline.txt'
    ];

    movedFiles.forEach(file => {
      const filePath = join(PROJECT_ROOT, file);
      expect(existsSync(filePath), `Moved configuration file ${file} should exist`).toBe(true);
    });
  });

  it('should have reports directory', () => {
    const reportsDir = join(PROJECT_ROOT, 'reports');
    expect(existsSync(reportsDir), 'Reports directory should exist').toBe(true);
  });

  it('should have docs directory', () => {
    const docsDir = join(PROJECT_ROOT, 'docs');
    expect(existsSync(docsDir), 'Documentation directory should exist').toBe(true);
  });

  it('should have assets directory', () => {
    const assetsDir = join(PROJECT_ROOT, 'assets');
    expect(existsSync(assetsDir), 'Assets directory should exist').toBe(true);
  });
});