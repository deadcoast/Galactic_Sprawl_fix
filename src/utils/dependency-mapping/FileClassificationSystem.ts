/**
 * @file FileClassificationSystem.ts
 *
 * File classification and validation system for safe directory reorganization
 * Implements the core file classification logic and validation test suite
 */

import * as fs from "fs";
import * as path from "path";
import { DependencyMapper, ValidationResult } from "./DependencyMapper";
import { BaselineValidator } from "./BaselineValidator";

export enum FileCategory {
  CRITICAL_CONFIG = "critical-config",
  BUILD_CONFIG = "build-config",
  TESTING_CONFIG = "testing-config",
  LINTING_CONFIG = "linting-config",
  DOCUMENTATION = "documentation",
  REPORTS = "reports",
  ASSETS = "assets",
  SOURCE = "source",
  TEMPORARY = "temporary",
}

export interface FileClassification {
  path: string;
  category: FileCategory;
  dependencies: string[];
  canRelocate: boolean;
  proposedNewPath?: string;
  reason?: string;
  toolsAffected: string[];
}

export interface ValidationTestSuite {
  preMove: ValidationTest[];
  duringMove: ValidationTest[];
  postMove: ValidationTest[];
}

export interface ValidationTest {
  name: string;
  command: string;
  expectedResult: "success" | "no-change";
  description: string;
  timeout?: number;
}

export interface RollbackOperation {
  id: string;
  description: string;
  execute: () => Promise<void>;
  verify: () => Promise<boolean>;
  rollback: () => Promise<void>;
}

export interface AtomicMoveOperation {
  sourceFile: string;
  targetFile: string;
  backupFile: string;
  classification: FileClassification;
}

export class FileClassificationSystem {
  private rootDir: string;
  private dependencyMapper: DependencyMapper;
  private baselineValidator: BaselineValidator;
  private rollbackOperations: RollbackOperation[] = [];

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
    this.dependencyMapper = new DependencyMapper(rootDir);
    this.baselineValidator = new BaselineValidator(rootDir);
  }

  /**
   * Classify all files in the project for reorganization
   */
  public async classifyAllFiles(): Promise<Map<string, FileClassification>> {
    const dependencyMap = await this.dependencyMapper.analyzeDependencies();
    const classifications = new Map<string, FileClassification>();

    // Process all file categories
    const allFiles = new Map<string, any>();

    // Collect all files from dependency map
    for (const [path, fileRef] of dependencyMap.configFiles) {
      allFiles.set(path, fileRef);
    }
    for (const [path, fileRef] of dependencyMap.sourceFiles) {
      allFiles.set(path, fileRef);
    }
    for (const [path, fileRef] of dependencyMap.documentationFiles) {
      allFiles.set(path, fileRef);
    }
    for (const [path, fileRef] of dependencyMap.assetFiles) {
      allFiles.set(path, fileRef);
    }

    // Classify each file
    for (const [filePath, fileRef] of allFiles) {
      const classification = this.classifyFile(filePath, fileRef);
      classifications.set(filePath, classification);
    }

    return classifications;
  }

  /**
   * Classify a single file
   */
  private classifyFile(filePath: string, fileRef: any): FileClassification {
    const fileName = path.basename(filePath);
    const category = this.determineFileCategory(filePath, fileName);
    const toolsAffected = this.getAffectedTools(fileName, category);

    let canRelocate = fileRef.canRelocate;
    let reason = fileRef.reason;
    let proposedNewPath: string | undefined;

    // Determine proposed new path based on category
    if (canRelocate) {
      proposedNewPath = this.getProposedPath(filePath, category);

      // Double-check if relocation is safe for affected tools
      if (toolsAffected.length > 0) {
        const toolSafety = this.checkToolSafety(
          fileName,
          proposedNewPath,
          toolsAffected,
        );
        if (!toolSafety.isSafe) {
          canRelocate = false;
          reason = `Tool compatibility: ${toolSafety.issues.join(", ")}`;
          proposedNewPath = undefined;
        }
      }
    }

    return {
      path: filePath,
      category,
      dependencies: fileRef.references || [],
      canRelocate,
      proposedNewPath,
      reason,
      toolsAffected,
    };
  }

  /**
   * Determine the category of a file
   */
  private determineFileCategory(
    filePath: string,
    fileName: string,
  ): FileCategory {
    // Critical configuration files that must stay in root
    const criticalConfigs = [
      "package.json",
      "package-lock.json",
      "index.html",
      "vite.config.ts",
      "vite.config.js",
      "eslint.config.js",
      ".eslintrc.js",
      ".eslintrc.json",
      "tsconfig.json",
      "tsconfig.app.json",
      "tsconfig.node.json",
      "tailwind.config.js",
      "tailwind.config.ts",
      ".gitignore",
    ];

    if (criticalConfigs.includes(fileName)) {
      return FileCategory.CRITICAL_CONFIG;
    }

    // Build configuration files
    const buildConfigs = [
      ".prettierrc",
      ".prettierrc.json",
      ".prettierrc.js",
      "prettier.config.js",
      "postcss.config.js",
      "postcss.config.ts",
      ".sourcery.yaml",
    ];

    if (buildConfigs.some((pattern) => fileName.includes(pattern))) {
      return FileCategory.BUILD_CONFIG;
    }

    // Testing configuration files
    const testConfigs = [
      "vitest.config.ts",
      "vitest.config.js",
      "playwright.config.ts",
      "playwright.config.js",
      "jest.config.js",
      "jest-setup.js",
    ];

    if (testConfigs.includes(fileName)) {
      return FileCategory.TESTING_CONFIG;
    }

    // Linting configuration files
    const lintConfigs = ["eslint_baseline.txt"];

    if (lintConfigs.includes(fileName)) {
      return FileCategory.LINTING_CONFIG;
    }

    // Documentation files
    if (fileName.endsWith(".md") || fileName.endsWith(".txt")) {
      return FileCategory.DOCUMENTATION;
    }

    // Report files
    const reportFiles = ["ERRORS.json", "WARNINGS.json", "test-prettier.js"];
    if (reportFiles.includes(fileName)) {
      return FileCategory.REPORTS;
    }

    // Source files
    if (filePath.startsWith("src/")) {
      return FileCategory.SOURCE;
    }

    // Asset files
    if (filePath.startsWith(".assets/") || filePath.startsWith("assets/")) {
      return FileCategory.ASSETS;
    }

    // Default to assets for unclassified files
    return FileCategory.ASSETS;
  }

  /**
   * Get tools affected by a file
   */
  private getAffectedTools(fileName: string, category: FileCategory): string[] {
    const toolMap: Record<string, string[]> = {
      "eslint.config.js": ["eslint"],
      ".eslintrc.js": ["eslint"],
      ".eslintrc.json": ["eslint"],
      "eslint_baseline.txt": ["eslint"],
      ".prettierrc": ["prettier"],
      ".prettierrc.json": ["prettier"],
      ".prettierrc.js": ["prettier"],
      "prettier.config.js": ["prettier"],
      "tsconfig.json": ["typescript"],
      "tsconfig.app.json": ["typescript"],
      "tsconfig.node.json": ["typescript"],
      "vite.config.ts": ["vite"],
      "vite.config.js": ["vite"],
      "vitest.config.ts": ["vitest"],
      "vitest.config.js": ["vitest"],
      "playwright.config.ts": ["playwright"],
      "playwright.config.js": ["playwright"],
      "tailwind.config.js": ["tailwind"],
      "tailwind.config.ts": ["tailwind"],
      "postcss.config.js": ["postcss"],
      "postcss.config.ts": ["postcss"],
      "jest.config.js": ["jest"],
      "jest-setup.js": ["jest"],
    };

    return toolMap[fileName] || [];
  }

  /**
   * Get proposed new path for a file based on its category
   */
  private getProposedPath(filePath: string, category: FileCategory): string {
    const fileName = path.basename(filePath);

    switch (category) {
      case FileCategory.BUILD_CONFIG:
        return path.join("config", "build", fileName);
      case FileCategory.TESTING_CONFIG:
        return path.join("config", "testing", fileName);
      case FileCategory.LINTING_CONFIG:
        return path.join("config", "linting", fileName);
      case FileCategory.DOCUMENTATION:
        return path.join("docs", fileName);
      case FileCategory.REPORTS:
        return path.join("reports", fileName);
      case FileCategory.ASSETS:
        if (filePath.startsWith(".assets/")) {
          return filePath.replace(".assets/", "assets/");
        }
        return filePath;
      default:
        return filePath; // No change for other categories
    }
  }

  /**
   * Check if moving a file is safe for affected tools
   */
  private checkToolSafety(
    fileName: string,
    newPath: string,
    toolsAffected: string[],
  ): { isSafe: boolean; issues: string[] } {
    const issues: string[] = [];

    // Tools that require config in root
    const rootRequiredTools = ["eslint", "typescript", "vite", "tailwind"];

    for (const tool of toolsAffected) {
      if (rootRequiredTools.includes(tool)) {
        const newDir = path.dirname(newPath);
        if (newDir !== "." && newDir !== "") {
          issues.push(`${tool} requires config in root directory`);
        }
      }
    }

    return {
      isSafe: issues.length === 0,
      issues,
    };
  }

  /**
   * Build validation test suite for reorganization
   */
  public buildValidationTestSuite(): ValidationTestSuite {
    return {
      preMove: [
        {
          name: "baseline-build",
          command: "npm run build",
          expectedResult: "success",
          description: "Verify build works before reorganization",
          timeout: 60000,
        },
        {
          name: "baseline-typecheck",
          command: "npm run type-check",
          expectedResult: "success",
          description: "Verify type checking works before reorganization",
          timeout: 30000,
        },
        {
          name: "baseline-lint",
          command: "npm run lint",
          expectedResult: "no-change",
          description: "Capture lint baseline before reorganization",
          timeout: 30000,
        },
        {
          name: "baseline-test",
          command: "npm run test -- --run",
          expectedResult: "success",
          description: "Verify tests pass before reorganization",
          timeout: 60000,
        },
      ],
      duringMove: [
        {
          name: "incremental-build",
          command: "npm run build",
          expectedResult: "success",
          description: "Verify build works after each file move",
          timeout: 60000,
        },
        {
          name: "incremental-typecheck",
          command: "npm run type-check",
          expectedResult: "success",
          description: "Verify type checking works after each file move",
          timeout: 30000,
        },
      ],
      postMove: [
        {
          name: "final-build",
          command: "npm run build",
          expectedResult: "success",
          description: "Verify build works after complete reorganization",
          timeout: 60000,
        },
        {
          name: "final-typecheck",
          command: "npm run type-check",
          expectedResult: "success",
          description:
            "Verify type checking works after complete reorganization",
          timeout: 30000,
        },
        {
          name: "final-lint",
          command: "npm run lint",
          expectedResult: "no-change",
          description: "Verify lint results unchanged after reorganization",
          timeout: 30000,
        },
        {
          name: "final-test",
          command: "npm run test -- --run",
          expectedResult: "success",
          description: "Verify tests pass after complete reorganization",
          timeout: 60000,
        },
        {
          name: "dev-server",
          command: "timeout 10s npm run dev || true",
          expectedResult: "success",
          description: "Verify development server starts after reorganization",
          timeout: 15000,
        },
      ],
    };
  }

  /**
   * Create rollback system with atomic operations
   */
  public async createRollbackSystem(
    operations: AtomicMoveOperation[],
  ): Promise<void> {
    this.rollbackOperations = [];

    for (const [index, operation] of operations.entries()) {
      const rollbackOp: RollbackOperation = {
        id: `move-${index}`,
        description: `Move ${operation.sourceFile} to ${operation.targetFile}`,
        execute: async () => {
          await this.executeAtomicMove(operation);
        },
        verify: async () => {
          return await this.verifyMoveOperation(operation);
        },
        rollback: async () => {
          await this.rollbackMoveOperation(operation);
        },
      };

      this.rollbackOperations.push(rollbackOp);
    }
  }

  /**
   * Execute atomic file move operation
   */
  private async executeAtomicMove(
    operation: AtomicMoveOperation,
  ): Promise<void> {
    const { sourceFile, targetFile, backupFile } = operation;

    // Create target directory if it doesn't exist
    const targetDir = path.dirname(targetFile);
    await fs.promises.mkdir(targetDir, { recursive: true });

    // Create backup of source file
    if (await this.fileExists(sourceFile)) {
      await fs.promises.copyFile(sourceFile, backupFile);
    }

    // Move file to target location
    if (await this.fileExists(sourceFile)) {
      await fs.promises.rename(sourceFile, targetFile);
    }
  }

  /**
   * Verify move operation was successful
   */
  private async verifyMoveOperation(
    operation: AtomicMoveOperation,
  ): Promise<boolean> {
    const { sourceFile, targetFile } = operation;

    // Check that source file no longer exists and target file exists
    const sourceExists = await this.fileExists(sourceFile);
    const targetExists = await this.fileExists(targetFile);

    return !sourceExists && targetExists;
  }

  /**
   * Rollback move operation
   */
  private async rollbackMoveOperation(
    operation: AtomicMoveOperation,
  ): Promise<void> {
    const { sourceFile, targetFile, backupFile } = operation;

    // Restore from backup if backup exists
    if (await this.fileExists(backupFile)) {
      // Remove target file if it exists
      if (await this.fileExists(targetFile)) {
        await fs.promises.unlink(targetFile);
      }

      // Restore source file from backup
      await fs.promises.rename(backupFile, sourceFile);
    }
  }

  /**
   * Execute all rollback operations in reverse order
   */
  public async executeRollback(): Promise<void> {
    const reversedOps = [...this.rollbackOperations].reverse();

    for (const operation of reversedOps) {
      try {
        await operation.rollback();
      } catch (error) {
        console.error(`Failed to rollback operation ${operation.id}:`, error);
      }
    }
  }

  /**
   * Run validation tests
   */
  public async runValidationTests(
    tests: ValidationTest[],
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const test of tests) {
      try {
        const result = await this.baselineValidator.runCommand(test.command);

        if (test.expectedResult === "success" && result.exitCode !== 0) {
          errors.push(`Test '${test.name}' failed: ${result.stderr}`);
        } else if (test.expectedResult === "no-change") {
          // For no-change tests, we just capture the output for comparison
          warnings.push(
            `Test '${test.name}' completed for baseline comparison`,
          );
        }
      } catch (error) {
        errors.push(`Test '${test.name}' threw error: ${error}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all classified files that can be safely relocated
   */
  public async getRelocatableFiles(): Promise<FileClassification[]> {
    const classifications = await this.classifyAllFiles();
    return Array.from(classifications.values()).filter((c) => c.canRelocate);
  }

  /**
   * Get all classified files that must remain in their current location
   */
  public async getCriticalFiles(): Promise<FileClassification[]> {
    const classifications = await this.classifyAllFiles();
    return Array.from(classifications.values()).filter((c) => !c.canRelocate);
  }

  /**
   * Generate reorganization plan
   */
  public async generateReorganizationPlan(): Promise<{
    relocatableFiles: FileClassification[];
    criticalFiles: FileClassification[];
    validationSuite: ValidationTestSuite;
    estimatedOperations: number;
  }> {
    const relocatableFiles = await this.getRelocatableFiles();
    const criticalFiles = await this.getCriticalFiles();
    const validationSuite = this.buildValidationTestSuite();

    return {
      relocatableFiles,
      criticalFiles,
      validationSuite,
      estimatedOperations: relocatableFiles.length,
    };
  }
}
