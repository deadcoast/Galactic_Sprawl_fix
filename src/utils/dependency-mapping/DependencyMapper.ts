/**
 * @file DependencyMapper.ts
 * 
 * Comprehensive dependency mapping tool to analyze all file references
 * for safe directory reorganization.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface FileReference {
  filePath: string;
  referencedBy: string[];
  references: string[];
  canRelocate: boolean;
  reason?: string;
}

export interface DependencyMap {
  configFiles: Map<string, FileReference>;
  sourceFiles: Map<string, FileReference>;
  documentationFiles: Map<string, FileReference>;
  assetFiles: Map<string, FileReference>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class DependencyMapper {
  private rootDir: string;
  private dependencyMap: DependencyMap;
  
  // Critical files that must remain in root
  private readonly criticalRootFiles = new Set([
    'package.json',
    'package-lock.json',
    'index.html',
    'vite.config.ts',
    'eslint.config.js',
    'tsconfig.json',
    'tsconfig.app.json',
    'tsconfig.node.json',
    'playwright.config.ts',
    'vitest.config.ts',
    'tailwind.config.js',
    '.gitignore'
  ]);

  // File patterns for different categories
  private readonly configPatterns = [
    /\.prettierrc.*$/,
    /\.sourcery\.yaml$/,
    /postcss\.config\.js$/,
    /jest\.config\.js$/,
    /jest-setup\.js$/,
    /eslint_baseline\.txt$/
  ];

  private readonly documentationPatterns = [
    /\.md$/,
    /\.txt$/ // for documentation-like files
  ];

  private readonly reportPatterns = [
    /ERRORS\.json$/,
    /WARNINGS\.json$/,
    /test-prettier\.js$/
  ];

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
    this.dependencyMap = {
      configFiles: new Map(),
      sourceFiles: new Map(),
      documentationFiles: new Map(),
      assetFiles: new Map()
    };
  }

  /**
   * Analyze all file dependencies in the project
   */
  public async analyzeDependencies(): Promise<DependencyMap> {
    const files = await this.getAllFiles();
    
    for (const filePath of files) {
      const relativePath = path.relative(this.rootDir, filePath);
      const fileRef = await this.analyzeFile(filePath, relativePath);
      this.categorizeFile(relativePath, fileRef);
    }

    // Analyze cross-references
    await this.analyzeCrossReferences();
    
    return this.dependencyMap;
  }

  /**
   * Get all files in the project (excluding node_modules, .git, etc.)
   */
  private async getAllFiles(): Promise<string[]> {
    const files: string[] = [];
    const excludeDirs = new Set(['node_modules', '.git', 'dist', 'build', 'coverage']);
    
    const walkDir = async (dir: string): Promise<void> => {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !excludeDirs.has(entry.name)) {
          await walkDir(fullPath);
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
    };

    await walkDir(this.rootDir);
    return files;
  }

  /**
   * Analyze a single file for dependencies
   */
  private async analyzeFile(filePath: string, relativePath: string): Promise<FileReference> {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const references = this.extractReferences(content, relativePath);
    
    const canRelocate = !this.criticalRootFiles.has(path.basename(relativePath));
    const reason = canRelocate ? undefined : 'Critical file that must remain in root';

    return {
      filePath: relativePath,
      referencedBy: [], // Will be populated in analyzeCrossReferences
      references,
      canRelocate,
      reason
    };
  }

  /**
   * Extract file references from content
   */
  private extractReferences(content: string, currentFile: string): string[] {
    const references: string[] = [];
    
    // Import/require patterns
    const importPatterns = [
      /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g,
      /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
      /import\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g
    ];

    // Configuration file references
    const configPatterns = [
      /"extends":\s*\[?\s*['"`]([^'"`]+)['"`]/g,
      /"config":\s*['"`]([^'"`]+)['"`]/g,
      /configFile:\s*['"`]([^'"`]+)['"`]/g
    ];

    // Script references in package.json
    const scriptPatterns = [
      /['"`]([^'"`]*\.(?:js|ts|json|md))['"`]/g
    ];

    const allPatterns = [...importPatterns, ...configPatterns, ...scriptPatterns];
    
    for (const pattern of allPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const ref = match[1];
        if (ref && !ref.startsWith('node_modules') && !ref.startsWith('@')) {
          references.push(this.resolveReference(ref, currentFile));
        }
      }
    }

    return Array.from(new Set(references)); // Remove duplicates
  }

  /**
   * Resolve relative references to absolute paths
   */
  private resolveReference(ref: string, currentFile: string): string {
    if (path.isAbsolute(ref)) {
      return ref;
    }
    
    const currentDir = path.dirname(currentFile);
    const resolved = path.resolve(currentDir, ref);
    return path.relative(this.rootDir, resolved);
  }

  /**
   * Categorize file into appropriate map
   */
  private categorizeFile(relativePath: string, fileRef: FileReference): void {
    const fileName = path.basename(relativePath);
    
    if (this.configPatterns.some(pattern => pattern.test(fileName)) || 
        this.criticalRootFiles.has(fileName)) {
      this.dependencyMap.configFiles.set(relativePath, fileRef);
    } else if (this.documentationPatterns.some(pattern => pattern.test(fileName))) {
      this.dependencyMap.documentationFiles.set(relativePath, fileRef);
    } else if (this.reportPatterns.some(pattern => pattern.test(fileName))) {
      this.dependencyMap.assetFiles.set(relativePath, fileRef);
    } else if (relativePath.startsWith('src/')) {
      this.dependencyMap.sourceFiles.set(relativePath, fileRef);
    } else {
      this.dependencyMap.assetFiles.set(relativePath, fileRef);
    }
  }

  /**
   * Analyze cross-references between files
   */
  private async analyzeCrossReferences(): Promise<void> {
    const allFiles = new Map<string, FileReference>();
    
    // Collect all files
    Array.from(this.dependencyMap.configFiles.entries()).forEach(([path, ref]) => {
      allFiles.set(path, ref);
    });
    Array.from(this.dependencyMap.sourceFiles.entries()).forEach(([path, ref]) => {
      allFiles.set(path, ref);
    });
    Array.from(this.dependencyMap.documentationFiles.entries()).forEach(([path, ref]) => {
      allFiles.set(path, ref);
    });
    Array.from(this.dependencyMap.assetFiles.entries()).forEach(([path, ref]) => {
      allFiles.set(path, ref);
    });

    // Build reverse reference map
    Array.from(allFiles.entries()).forEach(([filePath, fileRef]) => {
      for (const reference of fileRef.references) {
        const referencedFile = allFiles.get(reference);
        if (referencedFile) {
          referencedFile.referencedBy.push(filePath);
        }
      }
    });
  }

  /**
   * Validate that build system will work after reorganization
   */
  public validateBuildSystem(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check critical files are in root
    Array.from(this.criticalRootFiles).forEach(criticalFile => {
      const fileRef = this.dependencyMap.configFiles.get(criticalFile);
      if (fileRef && fileRef.canRelocate) {
        errors.push(`Critical file ${criticalFile} is marked as relocatable`);
      }
    });

    // Check for broken references after potential moves
    Array.from(this.dependencyMap.configFiles.values()).forEach(fileRef => {
      if (!fileRef.canRelocate) return;
      
      for (const referencedBy of fileRef.referencedBy) {
        const referencingFile = this.findFileReference(referencedBy);
        if (referencingFile && !referencingFile.canRelocate) {
          warnings.push(
            `Moving ${fileRef.filePath} may break reference from ${referencedBy}`
          );
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Find file reference across all maps
   */
  private findFileReference(filePath: string): FileReference | undefined {
    return this.dependencyMap.configFiles.get(filePath) ||
           this.dependencyMap.sourceFiles.get(filePath) ||
           this.dependencyMap.documentationFiles.get(filePath) ||
           this.dependencyMap.assetFiles.get(filePath);
  }

  /**
   * Get dependency map for testing
   */
  public getDependencyMap(): DependencyMap {
    return this.dependencyMap;
  }

  /**
   * Create backup of current workspace state
   */
  public async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(this.rootDir, `.backup-${timestamp}`);
    
    await fs.promises.mkdir(backupDir, { recursive: true });
    
    // Copy critical files
    const criticalFiles = [
      'package.json',
      'package-lock.json',
      'vite.config.ts',
      'tsconfig.json',
      'eslint.config.js'
    ];

    for (const file of criticalFiles) {
      const srcPath = path.join(this.rootDir, file);
      const destPath = path.join(backupDir, file);
      
      try {
        await fs.promises.copyFile(srcPath, destPath);
      } catch (error) {
        // File might not exist, continue
      }
    }

    return backupDir;
  }
}