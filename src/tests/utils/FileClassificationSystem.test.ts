/**
 * @file FileClassificationSystem.test.ts
 * 
 * Tests for the file classification and validation system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileClassificationSystem, FileCategory } from '../../utils/dependency-mapping/FileClassificationSystem';

// Mock the file system operations
vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    copyFile: vi.fn().mockResolvedValue(undefined),
    rename: vi.fn().mockResolvedValue(undefined),
    unlink: vi.fn().mockResolvedValue(undefined),
    access: vi.fn().mockResolvedValue(undefined),
    readdir: vi.fn().mockResolvedValue([]),
    readFile: vi.fn().mockResolvedValue(''),
    writeFile: vi.fn().mockResolvedValue(undefined)
  }
}));

// Mock the dependency mapper and baseline validator
vi.mock('../../utils/dependency-mapping/DependencyMapper', () => ({
  DependencyMapper: vi.fn().mockImplementation(() => ({
    analyzeDependencies: vi.fn().mockResolvedValue({
      configFiles: new Map([
        ['package.json', { canRelocate: false, reason: 'Critical file', references: [] }],
        ['eslint.config.js', { canRelocate: false, reason: 'Critical file', references: [] }],
        ['.prettierrc', { canRelocate: true, references: [] }],
        ['vitest.config.ts', { canRelocate: true, references: [] }]
      ]),
      sourceFiles: new Map([
        ['src/main.ts', { canRelocate: true, references: [] }]
      ]),
      documentationFiles: new Map([
        ['README.md', { canRelocate: true, references: [] }]
      ]),
      assetFiles: new Map([
        ['ERRORS.json', { canRelocate: true, references: [] }]
      ])
    })
  }))
}));

vi.mock('../../utils/dependency-mapping/BaselineValidator', () => ({
  BaselineValidator: vi.fn().mockImplementation(() => ({
    runCommand: vi.fn().mockResolvedValue({
      command: 'test',
      exitCode: 0,
      stdout: 'success',
      stderr: '',
      timestamp: new Date(),
      duration: 1000
    })
  }))
}));

describe('FileClassificationSystem', () => {
  let classificationSystem: FileClassificationSystem;

  beforeEach(() => {
    classificationSystem = new FileClassificationSystem('/test/project');
  });

  describe('File Classification', () => {
    it('should classify all files correctly', async () => {
      const classifications = await classificationSystem.classifyAllFiles();
      
      expect(classifications.size).toBeGreaterThan(0);
      
      // Check that package.json is classified as critical
      const packageJson = classifications.get('package.json');
      expect(packageJson?.category).toBe(FileCategory.CRITICAL_CONFIG);
      expect(packageJson?.canRelocate).toBe(false);
      
      // Check that .prettierrc is classified as build config
      const prettierrc = classifications.get('.prettierrc');
      expect(prettierrc?.category).toBe(FileCategory.BUILD_CONFIG);
      expect(prettierrc?.canRelocate).toBe(true);
      expect(prettierrc?.proposedNewPath).toBe('config/build/.prettierrc');
      
      // Check that README.md is classified as documentation
      const readme = classifications.get('README.md');
      expect(readme?.category).toBe(FileCategory.DOCUMENTATION);
      expect(readme?.canRelocate).toBe(true);
      expect(readme?.proposedNewPath).toBe('docs/README.md');
    });

    it('should identify relocatable files correctly', async () => {
      const relocatableFiles = await classificationSystem.getRelocatableFiles();
      
      expect(relocatableFiles.length).toBeGreaterThan(0);
      
      // All relocatable files should have canRelocate = true
      for (const file of relocatableFiles) {
        expect(file.canRelocate).toBe(true);
        expect(file.proposedNewPath).toBeDefined();
      }
      
      // Should include .prettierrc, vitest.config.ts, README.md, ERRORS.json
      const filePaths = relocatableFiles.map(f => f.path);
      expect(filePaths).toContain('.prettierrc');
      expect(filePaths).toContain('vitest.config.ts');
      expect(filePaths).toContain('README.md');
      expect(filePaths).toContain('ERRORS.json');
    });

    it('should identify critical files correctly', async () => {
      const criticalFiles = await classificationSystem.getCriticalFiles();
      
      expect(criticalFiles.length).toBeGreaterThan(0);
      
      // All critical files should have canRelocate = false
      for (const file of criticalFiles) {
        expect(file.canRelocate).toBe(false);
        expect(file.reason).toBeDefined();
      }
      
      // Should include package.json and eslint.config.js
      const filePaths = criticalFiles.map(f => f.path);
      expect(filePaths).toContain('package.json');
      expect(filePaths).toContain('eslint.config.js');
    });
  });

  describe('Validation Test Suite', () => {
    it('should build comprehensive validation test suite', () => {
      const testSuite = classificationSystem.buildValidationTestSuite();
      
      // Should have all three phases
      expect(testSuite.preMove.length).toBeGreaterThan(0);
      expect(testSuite.duringMove.length).toBeGreaterThan(0);
      expect(testSuite.postMove.length).toBeGreaterThan(0);
      
      // Pre-move tests should include baseline validation
      const preMoveNames = testSuite.preMove.map(t => t.name);
      expect(preMoveNames).toContain('baseline-build');
      expect(preMoveNames).toContain('baseline-typecheck');
      expect(preMoveNames).toContain('baseline-lint');
      expect(preMoveNames).toContain('baseline-test');
      
      // Post-move tests should include final validation
      const postMoveNames = testSuite.postMove.map(t => t.name);
      expect(postMoveNames).toContain('final-build');
      expect(postMoveNames).toContain('final-typecheck');
      expect(postMoveNames).toContain('final-lint');
      expect(postMoveNames).toContain('final-test');
      expect(postMoveNames).toContain('dev-server');
    });

    it('should run validation tests successfully', async () => {
      const testSuite = classificationSystem.buildValidationTestSuite();
      const result = await classificationSystem.runValidationTests(testSuite.preMove);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Rollback System', () => {
    it('should create rollback system with atomic operations', async () => {
      const operations = [
        {
          sourceFile: '.prettierrc',
          targetFile: 'config/build/.prettierrc',
          backupFile: '.backup/.prettierrc',
          classification: {
            path: '.prettierrc',
            category: FileCategory.BUILD_CONFIG,
            dependencies: [],
            canRelocate: true,
            proposedNewPath: 'config/build/.prettierrc',
            toolsAffected: ['prettier']
          }
        }
      ];

      await classificationSystem.createRollbackSystem(operations);
      
      // Should not throw errors
      expect(true).toBe(true);
    });
  });

  describe('Reorganization Plan', () => {
    it('should generate comprehensive reorganization plan', async () => {
      const plan = await classificationSystem.generateReorganizationPlan();
      
      expect(plan.relocatableFiles.length).toBeGreaterThan(0);
      expect(plan.criticalFiles.length).toBeGreaterThan(0);
      expect(plan.validationSuite).toBeDefined();
      expect(plan.estimatedOperations).toBe(plan.relocatableFiles.length);
      
      // Validation suite should have all phases
      expect(plan.validationSuite.preMove.length).toBeGreaterThan(0);
      expect(plan.validationSuite.duringMove.length).toBeGreaterThan(0);
      expect(plan.validationSuite.postMove.length).toBeGreaterThan(0);
    });
  });

  describe('File Category Determination', () => {
    it('should categorize files correctly by type', async () => {
      const classifications = await classificationSystem.classifyAllFiles();
      
      // Test specific file categorizations
      const testCases = [
        { file: 'package.json', expectedCategory: FileCategory.CRITICAL_CONFIG },
        { file: 'eslint.config.js', expectedCategory: FileCategory.CRITICAL_CONFIG },
        { file: '.prettierrc', expectedCategory: FileCategory.BUILD_CONFIG },
        { file: 'vitest.config.ts', expectedCategory: FileCategory.TESTING_CONFIG },
        { file: 'README.md', expectedCategory: FileCategory.DOCUMENTATION },
        { file: 'ERRORS.json', expectedCategory: FileCategory.REPORTS },
        { file: 'src/main.ts', expectedCategory: FileCategory.SOURCE }
      ];

      for (const testCase of testCases) {
        const classification = classifications.get(testCase.file);
        expect(classification?.category).toBe(testCase.expectedCategory);
      }
    });

    it('should identify affected tools correctly', async () => {
      const classifications = await classificationSystem.classifyAllFiles();
      
      // Test tool identification
      const eslintConfig = classifications.get('eslint.config.js');
      expect(eslintConfig?.toolsAffected).toContain('eslint');
      
      const prettierConfig = classifications.get('.prettierrc');
      expect(prettierConfig?.toolsAffected).toContain('prettier');
      
      const vitestConfig = classifications.get('vitest.config.ts');
      expect(vitestConfig?.toolsAffected).toContain('vitest');
    });
  });

  describe('Tool Safety Checks', () => {
    it('should prevent unsafe tool configuration moves', async () => {
      const classifications = await classificationSystem.classifyAllFiles();
      
      // ESLint config should not be relocatable (tool requires root)
      const eslintConfig = classifications.get('eslint.config.js');
      expect(eslintConfig?.canRelocate).toBe(false);
      expect(eslintConfig?.reason).toContain('Critical file');
      
      // Prettier config should be relocatable (tool supports --config flag)
      const prettierConfig = classifications.get('.prettierrc');
      expect(prettierConfig?.canRelocate).toBe(true);
      expect(prettierConfig?.proposedNewPath).toBe('config/build/.prettierrc');
    });
  });

  describe('Proposed Path Generation', () => {
    it('should generate appropriate proposed paths for different file categories', async () => {
      const classifications = await classificationSystem.classifyAllFiles();
      
      // Test proposed paths for different categories
      const testCases = [
        { file: '.prettierrc', expectedPath: 'config/build/.prettierrc' },
        { file: 'vitest.config.ts', expectedPath: 'config/testing/vitest.config.ts' },
        { file: 'README.md', expectedPath: 'docs/README.md' },
        { file: 'ERRORS.json', expectedPath: 'reports/ERRORS.json' }
      ];

      for (const testCase of testCases) {
        const classification = classifications.get(testCase.file);
        if (classification?.canRelocate) {
          expect(classification.proposedNewPath).toBe(testCase.expectedPath);
        }
      }
    });
  });
});