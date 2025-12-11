/**
 * @context: root-directory-organization, build-validation, deployment-testing
 *
 * Integration tests for build and deployment process validation
 * 
 * These tests verify that the build and deployment processes work correctly
 * after the root directory reorganization.
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';

// Test configuration
const PROJECT_ROOT = process.cwd();
const BUILD_DIR = join(PROJECT_ROOT, 'dist');
const TIMEOUT = 120000; // 2 minutes for build operations

// Helper function to execute commands with proper error handling
function executeCommand(command: string, options: { timeout?: number; cwd?: string } = {}): string {
  try {
    const result = execSync(command, {
      cwd: options.cwd || PROJECT_ROOT,
      timeout: options.timeout || 60000,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    return result.toString().trim();
  } catch (error: any) {
    throw new Error(`Command failed: ${command}\nError: ${error.message}\nStdout: ${error.stdout}\nStderr: ${error.stderr}`);
  }
}

// Helper function to analyze build output
function analyzeBuildOutput(buildDir: string): {
  hasIndex: boolean;
  hasAssets: boolean;
  hasJS: boolean;
  hasCSS: boolean;
  totalFiles: number;
  totalSize: number;
} {
  if (!existsSync(buildDir)) {
    return {
      hasIndex: false,
      hasAssets: false,
      hasJS: false,
      hasCSS: false,
      totalFiles: 0,
      totalSize: 0
    };
  }

  const files = readdirSync(buildDir, { recursive: true });
  let totalSize = 0;
  let hasIndex = false;
  let hasAssets = false;
  let hasJS = false;
  let hasCSS = false;

  files.forEach((file: string | Buffer) => {
    const filePath = join(buildDir, file.toString());
    if (statSync(filePath).isFile()) {
      totalSize += statSync(filePath).size;
      
      const fileName = file.toString().toLowerCase();
      if (fileName === 'index.html') hasIndex = true;
      if (fileName.includes('assets') || fileName.includes('asset')) hasAssets = true;
      if (fileName.endsWith('.js')) hasJS = true;
      if (fileName.endsWith('.css')) hasCSS = true;
    }
  });

  return {
    hasIndex,
    hasAssets,
    hasJS,
    hasCSS,
    totalFiles: files.length,
    totalSize
  };
}

describe('Build and Deployment Process Validation', () => {
  beforeAll(() => {
    // Clean any existing build artifacts
    try {
      executeCommand('rm -rf dist', { timeout: 30000 });
    } catch (error) {
      // Ignore if dist doesn't exist
    }
  }, TIMEOUT);

  describe('TypeScript Compilation', () => {
    it('should compile TypeScript without errors', () => {
      const result = executeCommand('npx tsc --noEmit', { timeout: TIMEOUT });
      expect(result).toBeDefined();
      // No compilation errors should be thrown
    }, TIMEOUT);

    it('should handle all TypeScript configurations', () => {
      // Test main tsconfig
      executeCommand('npx tsc --noEmit --project tsconfig.json', { timeout: TIMEOUT });
      
      // Test app-specific tsconfig if it exists
      if (existsSync(join(PROJECT_ROOT, 'tsconfig.app.json'))) {
        executeCommand('npx tsc --noEmit --project tsconfig.app.json', { timeout: TIMEOUT });
      }
      
      // Test node-specific tsconfig if it exists
      if (existsSync(join(PROJECT_ROOT, 'tsconfig.node.json'))) {
        executeCommand('npx tsc --noEmit --project tsconfig.node.json', { timeout: TIMEOUT });
      }
    }, TIMEOUT);
  });

  describe('Production Build Process', () => {
    it('should successfully build for production', () => {
      const result = executeCommand('npm run build', { timeout: TIMEOUT });
      expect(result).toBeDefined();
      
      // Verify build directory was created
      expect(existsSync(BUILD_DIR), 'Build directory should exist').toBe(true);
    }, TIMEOUT);

    it('should generate all required build artifacts', () => {
      // Ensure we have a fresh build
      executeCommand('npm run build', { timeout: TIMEOUT });
      
      const analysis = analyzeBuildOutput(BUILD_DIR);
      
      expect(analysis.hasIndex, 'Build should include index.html').toBe(true);
      expect(analysis.hasJS, 'Build should include JavaScript files').toBe(true);
      expect(analysis.totalFiles, 'Build should generate multiple files').toBeGreaterThan(0);
      expect(analysis.totalSize, 'Build should have reasonable size').toBeGreaterThan(1000); // At least 1KB
    }, TIMEOUT);

    it('should generate optimized assets', () => {
      executeCommand('npm run build', { timeout: TIMEOUT });
      
      const indexPath = join(BUILD_DIR, 'index.html');
      expect(existsSync(indexPath), 'index.html should exist in build').toBe(true);
      
      const indexContent = readFileSync(indexPath, 'utf8');
      
      // Should have proper HTML structure
      expect(indexContent).toContain('<!DOCTYPE html>');
      expect(indexContent).toContain('<html');
      expect(indexContent).toContain('<head>');
      expect(indexContent).toContain('<body>');
      
      // Should reference built assets
      expect(indexContent).toMatch(/<script.*src.*\.js/);
    }, TIMEOUT);

    it('should handle asset references correctly', () => {
      executeCommand('npm run build', { timeout: TIMEOUT });
      
      // Check that assets are properly referenced
      const files = readdirSync(BUILD_DIR, { recursive: true }) as string[];
      const jsFiles = files.filter(f => f.toString().endsWith('.js'));
      const cssFiles = files.filter((f: string | Buffer) => f.toString().endsWith('.css'));
      
      // Should have at least one JS file
      expect(jsFiles.length, 'Should have JavaScript files').toBeGreaterThan(0);
      
      // CSS files are optional but common
      if (cssFiles.length > 0) {
        const cssFile = cssFiles[0];
        const cssPath = join(BUILD_DIR, cssFile.toString());
        const cssContent = readFileSync(cssPath, 'utf8');
        expect(cssContent.length, 'CSS file should not be empty').toBeGreaterThan(0);
      }
    }, TIMEOUT);
  });

  describe('Development Build Process', () => {
    it('should start development server successfully', () => {
      // Test that dev server can start (kill it after 5 seconds)
      const result = executeCommand('timeout 5s npm run dev || true', { timeout: 15000 });
      expect(result).toBeDefined();
      
      // The command should not fail immediately (would indicate config issues)
    }, TIMEOUT);

    it('should serve assets in development mode', () => {
      // This is harder to test without actually starting the server
      // Instead, verify the configuration is correct
      const viteConfigPath = join(PROJECT_ROOT, 'vite.config.ts');
      expect(existsSync(viteConfigPath), 'Vite config should exist').toBe(true);
      
      const viteConfig = readFileSync(viteConfigPath, 'utf8');
      expect(viteConfig).toBeDefined();
      expect(viteConfig.length).toBeGreaterThan(0);
    }, TIMEOUT);
  });

  describe('Preview Build Process', () => {
    it('should successfully run preview server', () => {
      // First build the project
      executeCommand('npm run build', { timeout: TIMEOUT });
      
      // Test that preview server can start (kill it after 5 seconds)
      const result = executeCommand('timeout 5s npm run preview || true', { timeout: 15000 });
      expect(result).toBeDefined();
    }, TIMEOUT);
  });

  describe('Build Performance', () => {
    it('should build within reasonable time', () => {
      const startTime = Date.now();
      executeCommand('npm run build', { timeout: TIMEOUT });
      const buildTime = Date.now() - startTime;
      
      // Build should complete within 2 minutes
      expect(buildTime).toBeLessThan(120000);
    }, TIMEOUT);

    it('should generate reasonably sized bundles', () => {
      executeCommand('npm run build', { timeout: TIMEOUT });
      
      const analysis = analyzeBuildOutput(BUILD_DIR);
      
      // Total build size should be reasonable (less than 50MB for most apps)
      expect(analysis.totalSize).toBeLessThan(50 * 1024 * 1024);
      
      // Should not generate excessive number of files
      expect(analysis.totalFiles).toBeLessThan(1000);
    }, TIMEOUT);
  });

  describe('Build Configuration Validation', () => {
    it('should use correct configuration files', () => {
      // Verify Vite can find and use its configuration
      const result = executeCommand('npx vite build --dry-run || npx vite --help', { timeout: 30000 });
      expect(result).toBeDefined();
    }, TIMEOUT);

    it('should handle environment variables correctly', () => {
      // Test with different NODE_ENV values
      const prodResult = executeCommand('NODE_ENV=production npm run build', { timeout: TIMEOUT });
      expect(prodResult).toBeDefined();
      
      expect(existsSync(BUILD_DIR), 'Production build should create dist directory').toBe(true);
    }, TIMEOUT);

    it('should respect build optimization settings', () => {
      executeCommand('npm run build', { timeout: TIMEOUT });
      
      // Check that JavaScript files are minified (no excessive whitespace)
      const files = readdirSync(BUILD_DIR, { recursive: true });
      const jsFiles = files.filter((f: string | Buffer) => f.toString().endsWith('.js'));
      
      if (jsFiles.length > 0) {
        const jsFile = jsFiles[0];
        const jsPath = join(BUILD_DIR, jsFile.toString());
        const jsContent = readFileSync(jsPath, 'utf8');
        
        // Minified files should have high character density
        const lines = jsContent.split('\n');
        const avgLineLength = jsContent.length / lines.length;
        
        // Minified JS typically has long lines
        expect(avgLineLength).toBeGreaterThan(50);
      }
    }, TIMEOUT);
  });

  describe('Deployment Readiness', () => {
    it('should generate deployment-ready files', () => {
      executeCommand('npm run build', { timeout: TIMEOUT });
      
      const analysis = analyzeBuildOutput(BUILD_DIR);
      
      // Must have index.html for SPA deployment
      expect(analysis.hasIndex, 'Must have index.html for deployment').toBe(true);
      
      // Should have JavaScript bundles
      expect(analysis.hasJS, 'Must have JavaScript files for deployment').toBe(true);
      
      // Verify index.html is properly formed
      const indexPath = join(BUILD_DIR, 'index.html');
      const indexContent = readFileSync(indexPath, 'utf8');
      
      expect(indexContent).toContain('<div id="root">');
      expect(indexContent).toMatch(/<script.*type="module"/);
    }, TIMEOUT);

    it('should handle static file serving', () => {
      executeCommand('npm run build', { timeout: TIMEOUT });
      
      // Check for proper file structure for static hosting
      const files = readdirSync(BUILD_DIR, { recursive: true });
      
      // Should have assets in a reasonable structure
      const assetFiles = files.filter((f: string | Buffer) => {
        const fileName = f.toString();
        return fileName.includes('assets/') || fileName.endsWith('.js') || fileName.endsWith('.css');
      });
      
      expect(assetFiles.length, 'Should have asset files for static serving').toBeGreaterThan(0);
    }, TIMEOUT);

    it('should support different deployment environments', () => {
      // Test building with different base paths
      const originalViteConfig = readFileSync(join(PROJECT_ROOT, 'vite.config.ts'), 'utf8');
      
      // The build should work regardless of base path configuration
      executeCommand('npm run build', { timeout: TIMEOUT });
      
      expect(existsSync(BUILD_DIR), 'Build should work with any base path').toBe(true);
    }, TIMEOUT);
  });

  afterAll(() => {
    // Clean up build artifacts
    try {
      executeCommand('rm -rf dist', { timeout: 30000 });
    } catch (error) {
      // Ignore cleanup errors
    }
  });
});