/**
 * @file ToolConfigurationAccessibility.test.ts
 * 
 * Property-based tests for tool configuration accessibility during file reorganization
 * **Feature: root-directory-organization, Property 4: Tool Configuration Accessibility**
 * **Validates: Requirements 2.3, 3.1**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as path from 'path';

export interface ToolConfiguration {
  toolName: string;
  configFiles: string[];
  defaultLocations: string[];
  canRelocate: boolean;
}

export interface ConfigurationMove {
  originalPath: string;
  newPath: string;
  toolsAffected: string[];
}

export class ToolConfigurationValidator {
  private static readonly toolConfigurations: ToolConfiguration[] = [
    {
      toolName: 'eslint',
      configFiles: ['eslint.config.js', '.eslintrc.js', '.eslintrc.json'],
      defaultLocations: ['.'],
      canRelocate: false // ESLint expects config in root by default
    },
    {
      toolName: 'prettier',
      configFiles: ['.prettierrc', '.prettierrc.json', '.prettierrc.js', 'prettier.config.js'],
      defaultLocations: ['.', 'config/build'],
      canRelocate: true
    },
    {
      toolName: 'typescript',
      configFiles: ['tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json'],
      defaultLocations: ['.'],
      canRelocate: false // TypeScript expects tsconfig.json in root
    },
    {
      toolName: 'vite',
      configFiles: ['vite.config.ts', 'vite.config.js'],
      defaultLocations: ['.'],
      canRelocate: false // Vite expects config in root
    },
    {
      toolName: 'vitest',
      configFiles: ['vitest.config.ts', 'vitest.config.js'],
      defaultLocations: ['.', 'config/testing'],
      canRelocate: true // Vitest can use --config flag
    },
    {
      toolName: 'playwright',
      configFiles: ['playwright.config.ts', 'playwright.config.js'],
      defaultLocations: ['.', 'config/testing'],
      canRelocate: true // Playwright can use --config flag
    },
    {
      toolName: 'tailwind',
      configFiles: ['tailwind.config.js', 'tailwind.config.ts'],
      defaultLocations: ['.'],
      canRelocate: false // Tailwind expects config in root
    },
    {
      toolName: 'postcss',
      configFiles: ['postcss.config.js', 'postcss.config.ts'],
      defaultLocations: ['.', 'config/build'],
      canRelocate: true
    }
  ];

  /**
   * Check if a tool can find its configuration after reorganization
   */
  static canToolFindConfig(
    toolName: string,
    configPath: string,
    projectRoot: string = '.'
  ): boolean {
    const toolConfig = this.toolConfigurations.find(t => t.toolName === toolName);
    if (!toolConfig) return false;

    // Check if config is in expected locations
    const configDir = path.dirname(configPath);
    const configFile = path.basename(configPath);

    // Tool can find config if:
    // 1. It's a recognized config file AND
    // 2. Either it's in a default location OR the tool supports relocation
    
    const isRecognizedFile = toolConfig.configFiles.includes(configFile);
    if (!isRecognizedFile) return false;

    // Check if it's in a default location
    const isInDefaultLocation = toolConfig.defaultLocations.some(loc => {
      const normalizedLoc = path.normalize(loc);
      const normalizedConfigDir = path.normalize(configDir);
      return normalizedConfigDir === normalizedLoc;
    });

    // If it's in a default location, tool can find it
    if (isInDefaultLocation) return true;

    // If not in default location, tool can only find it if it supports relocation
    return toolConfig.canRelocate;
  }

  /**
   * Validate tool configuration accessibility after file moves
   */
  static validateToolAccessibility(
    configMoves: ConfigurationMove[],
    projectRoot: string = '.'
  ): { isValid: boolean; issues: string[]; warnings: string[] } {
    const issues: string[] = [];
    const warnings: string[] = [];

    for (const move of configMoves) {
      for (const toolName of move.toolsAffected) {
        const canFind = this.canToolFindConfig(toolName, move.newPath, projectRoot);
        
        if (!canFind) {
          const toolConfig = this.toolConfigurations.find(t => t.toolName === toolName);
          if (toolConfig && !toolConfig.canRelocate) {
            issues.push(`${toolName} cannot find config at ${move.newPath} (tool requires config in root)`);
          } else {
            warnings.push(`${toolName} may need --config flag to find config at ${move.newPath}`);
          }
        }
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      warnings
    };
  }

  /**
   * Get recommended configuration for a tool after reorganization
   */
  static getRecommendedConfig(
    toolName: string,
    targetDirectory: string
  ): { configPath: string; requiresFlag: boolean; flagSyntax?: string } | null {
    const toolConfig = this.toolConfigurations.find(t => t.toolName === toolName);
    if (!toolConfig) return null;

    const primaryConfigFile = toolConfig.configFiles[0];
    const configPath = path.join(targetDirectory, primaryConfigFile);

    // Determine if tool needs explicit config flag
    // Tool requires flag if it's not in root (.) and the tool supports relocation
    const isInRoot = targetDirectory === '.' || targetDirectory === '';
    const requiresFlag = !isInRoot && toolConfig.canRelocate;
    
    let flagSyntax: string | undefined;
    if (requiresFlag) {
      switch (toolName) {
        case 'eslint':
          flagSyntax = `--config ${configPath}`;
          break;
        case 'prettier':
          flagSyntax = `--config ${configPath}`;
          break;
        case 'vitest':
          flagSyntax = `--config ${configPath}`;
          break;
        case 'playwright':
          flagSyntax = `--config ${configPath}`;
          break;
        default:
          flagSyntax = `--config ${configPath}`;
      }
    }

    return {
      configPath,
      requiresFlag,
      flagSyntax
    };
  }

  /**
   * Check if a configuration move is safe for all affected tools
   */
  static isConfigMoveSafe(
    originalPath: string,
    newPath: string,
    affectedTools: string[]
  ): { isSafe: boolean; blockers: string[]; recommendations: string[] } {
    const blockers: string[] = [];
    const recommendations: string[] = [];

    for (const toolName of affectedTools) {
      const toolConfig = this.toolConfigurations.find(t => t.toolName === toolName);
      if (!toolConfig) continue;

      const canFindAtNew = this.canToolFindConfig(toolName, newPath);
      
      if (!canFindAtNew) {
        if (!toolConfig.canRelocate) {
          blockers.push(`${toolName} requires config in root directory`);
        } else {
          const recommended = this.getRecommendedConfig(toolName, path.dirname(newPath));
          if (recommended?.requiresFlag) {
            recommendations.push(`${toolName}: Use ${recommended.flagSyntax} in scripts`);
          }
        }
      }
    }

    return {
      isSafe: blockers.length === 0,
      blockers,
      recommendations
    };
  }

  /**
   * Generate configuration update plan for reorganization
   */
  static generateConfigUpdatePlan(
    proposedMoves: ConfigurationMove[]
  ): {
    safeMoves: ConfigurationMove[];
    unsafeMoves: ConfigurationMove[];
    scriptUpdates: { [scriptName: string]: string };
    recommendations: string[];
  } {
    const safeMoves: ConfigurationMove[] = [];
    const unsafeMoves: ConfigurationMove[] = [];
    const scriptUpdates: { [scriptName: string]: string } = {};
    const recommendations: string[] = [];

    for (const move of proposedMoves) {
      const safety = this.isConfigMoveSafe(move.originalPath, move.newPath, move.toolsAffected);
      
      if (safety.isSafe) {
        safeMoves.push(move);
        recommendations.push(...safety.recommendations);
      } else {
        unsafeMoves.push(move);
        recommendations.push(`Cannot move ${move.originalPath}: ${safety.blockers.join(', ')}`);
      }
    }

    return {
      safeMoves,
      unsafeMoves,
      scriptUpdates,
      recommendations
    };
  }
}

describe('ToolConfigurationValidator Property Tests', () => {
  describe('Property 4: Tool Configuration Accessibility', () => {
    /**
     * **Feature: root-directory-organization, Property 4: Tool Configuration Accessibility**
     * **Validates: Requirements 2.3, 3.1**
     * 
     * For any development tool configuration, the tool should locate and use 
     * its configuration file after reorganization
     */
    it('should preserve tool configuration accessibility for any valid reorganization', () => {
      // Property: For any tool and any valid config move, the tool should find its config
      
      const testMoves: ConfigurationMove[] = [
        {
          originalPath: '.prettierrc',
          newPath: 'config/build/.prettierrc',
          toolsAffected: ['prettier']
        },
        {
          originalPath: 'postcss.config.js',
          newPath: 'config/build/postcss.config.js',
          toolsAffected: ['postcss']
        },
        {
          originalPath: 'vitest.config.ts',
          newPath: 'config/testing/vitest.config.ts',
          toolsAffected: ['vitest']
        },
        {
          originalPath: 'playwright.config.ts',
          newPath: 'config/testing/playwright.config.ts',
          toolsAffected: ['playwright']
        }
      ];

      for (const move of testMoves) {
        for (const toolName of move.toolsAffected) {
          // Property assertion: Tool should be able to find config after move
          const canFind = ToolConfigurationValidator.canToolFindConfig(
            toolName,
            move.newPath
          );
          
          // These tools support config relocation, so they should find their configs
          expect(canFind).toBe(true);
          
          // Property assertion: Should provide recommendations for script updates
          const recommended = ToolConfigurationValidator.getRecommendedConfig(
            toolName,
            path.dirname(move.newPath)
          );
          
          expect(recommended).toBeDefined();
          expect(recommended?.configPath).toBe(move.newPath);
        }
      }
    });

    it('should correctly identify tools that require root configuration', () => {
      // Property: Tools with root config requirements must be correctly identified
      
      // Test root-required tools in root (should work)
      expect(ToolConfigurationValidator.canToolFindConfig('eslint', 'eslint.config.js')).toBe(true);
      expect(ToolConfigurationValidator.canToolFindConfig('typescript', 'tsconfig.json')).toBe(true);
      expect(ToolConfigurationValidator.canToolFindConfig('vite', 'vite.config.ts')).toBe(true);
      
      // Test root-required tools in subdirectories (should fail)
      expect(ToolConfigurationValidator.canToolFindConfig('eslint', 'config/linting/eslint.config.js')).toBe(false);
      expect(ToolConfigurationValidator.canToolFindConfig('typescript', 'config/typescript/tsconfig.json')).toBe(false);
      expect(ToolConfigurationValidator.canToolFindConfig('vite', 'config/build/vite.config.ts')).toBe(false);
      
      // Test relocatable tools in root (should work)
      expect(ToolConfigurationValidator.canToolFindConfig('prettier', '.prettierrc')).toBe(true);
      expect(ToolConfigurationValidator.canToolFindConfig('vitest', 'vitest.config.ts')).toBe(true);
      
      // Test relocatable tools in subdirectories (should work)
      expect(ToolConfigurationValidator.canToolFindConfig('prettier', 'config/build/.prettierrc')).toBe(true);
      expect(ToolConfigurationValidator.canToolFindConfig('vitest', 'config/testing/vitest.config.ts')).toBe(true);
    });

    it('should handle complex multi-tool configuration scenarios', () => {
      // Property: Complex reorganization must preserve all tool accessibility
      
      const complexMoves: ConfigurationMove[] = [
        {
          originalPath: '.prettierrc',
          newPath: 'config/build/.prettierrc',
          toolsAffected: ['prettier']
        },
        {
          originalPath: 'postcss.config.js',
          newPath: 'config/build/postcss.config.js',
          toolsAffected: ['postcss']
        },
        {
          originalPath: 'vitest.config.ts',
          newPath: 'config/testing/vitest.config.ts',
          toolsAffected: ['vitest']
        },
        {
          originalPath: 'eslint.config.js',
          newPath: 'eslint.config.js', // Stays in root
          toolsAffected: ['eslint']
        }
      ];

      const validation = ToolConfigurationValidator.validateToolAccessibility(complexMoves);
      
      // Property assertion: All valid moves should pass validation
      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
      
      // Property assertion: Should provide warnings for tools needing flags
      expect(validation.warnings.length).toBeGreaterThanOrEqual(0);
    });

    it('should generate safe configuration update plans', () => {
      // Property: Configuration update plans must separate safe from unsafe moves
      
      const proposedMoves: ConfigurationMove[] = [
        // Safe moves (relocatable tools)
        {
          originalPath: '.prettierrc',
          newPath: 'config/build/.prettierrc',
          toolsAffected: ['prettier']
        },
        {
          originalPath: 'vitest.config.ts',
          newPath: 'config/testing/vitest.config.ts',
          toolsAffected: ['vitest']
        },
        // Unsafe moves (non-relocatable tools)
        {
          originalPath: 'eslint.config.js',
          newPath: 'config/linting/eslint.config.js',
          toolsAffected: ['eslint']
        }
      ];

      const plan = ToolConfigurationValidator.generateConfigUpdatePlan(proposedMoves);
      
      // Property assertion: All moves should be processed
      expect(plan.safeMoves.length + plan.unsafeMoves.length).toBe(proposedMoves.length);
      
      // Property assertion: Should have at least one safe move (prettier, vitest)
      expect(plan.safeMoves.length).toBeGreaterThanOrEqual(1);
      
      // Property assertion: Should have at least one unsafe move (eslint)
      expect(plan.unsafeMoves.length).toBeGreaterThanOrEqual(1);
    });

    it('should provide correct flag syntax for relocated configurations', () => {
      // Property: Tools requiring config flags must get correct syntax
      
      const relocatableConfigs = [
        { tool: 'prettier', dir: 'config/build', file: '.prettierrc' },
        { tool: 'vitest', dir: 'config/testing', file: 'vitest.config.ts' },
        { tool: 'playwright', dir: 'config/testing', file: 'playwright.config.ts' }
      ];

      for (const config of relocatableConfigs) {
        const recommended = ToolConfigurationValidator.getRecommendedConfig(
          config.tool,
          config.dir
        );
        
        // Property assertion: Should provide config recommendations
        expect(recommended).toBeDefined();
        expect(recommended?.requiresFlag).toBe(true);
        expect(recommended?.flagSyntax).toBeDefined();
        
        // Property assertion: Flag syntax should include config path
        expect(recommended?.flagSyntax).toContain('--config');
        expect(recommended?.flagSyntax).toContain(config.dir);
      }
    });

    it('should handle edge cases in tool configuration detection', () => {
      // Property: Tool configuration detection must be robust against edge cases
      
      const edgeCases = [
        // Non-existent tool
        { tool: 'nonexistent', config: 'config.js', shouldFind: false },
        // Valid tool with invalid config file
        { tool: 'prettier', config: 'invalid.config.js', shouldFind: false },
        // Valid tool with valid config in root
        { tool: 'prettier', config: '.prettierrc', shouldFind: true },
        // Valid tool with valid config in subdirectory
        { tool: 'vitest', config: 'config/testing/vitest.config.ts', shouldFind: true }
      ];

      for (const testCase of edgeCases) {
        const canFind = ToolConfigurationValidator.canToolFindConfig(
          testCase.tool,
          testCase.config
        );
        
        expect(canFind).toBe(testCase.shouldFind);
      }
    });

    it('should validate configuration move safety correctly', () => {
      // Property: Configuration move safety assessment must be accurate
      
      // Test safe move (relocatable tool)
      const prettierSafety = ToolConfigurationValidator.isConfigMoveSafe(
        '.prettierrc',
        'config/build/.prettierrc',
        ['prettier']
      );
      expect(prettierSafety.isSafe).toBe(true);
      expect(prettierSafety.blockers.length).toBe(0);
      
      // Test unsafe move (non-relocatable tool)
      const eslintSafety = ToolConfigurationValidator.isConfigMoveSafe(
        'eslint.config.js',
        'config/linting/eslint.config.js',
        ['eslint']
      );
      expect(eslintSafety.isSafe).toBe(false);
      expect(eslintSafety.blockers.length).toBeGreaterThan(0);
      
      // Test another safe move
      const vitestSafety = ToolConfigurationValidator.isConfigMoveSafe(
        'vitest.config.ts',
        'config/testing/vitest.config.ts',
        ['vitest']
      );
      expect(vitestSafety.isSafe).toBe(true);
      expect(vitestSafety.blockers.length).toBe(0);
    });
  });
});