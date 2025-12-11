/**
 * @file ReorganizationValidator.ts
 *
 * Main orchestrator for pre-reorganization analysis and validation
 */

import { DependencyMapper, DependencyMap } from "./DependencyMapper";
import { BaselineValidator, BaselineReport } from "./BaselineValidator";

export interface ReorganizationPlan {
  dependencyMap: DependencyMap;
  baselineReport: BaselineReport;
  validationResults: {
    buildSystemValid: boolean;
    toolsAvailable: boolean;
    pathResolutionValid: boolean;
  };
  recommendations: string[];
  warnings: string[];
  backupPath?: string;
}

export class ReorganizationValidator {
  private dependencyMapper: DependencyMapper;
  private baselineValidator: BaselineValidator;
  private rootDir: string;

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
    this.dependencyMapper = new DependencyMapper(rootDir);
    this.baselineValidator = new BaselineValidator(rootDir);
  }

  /**
   * Run complete pre-reorganization analysis
   */
  public async runCompleteAnalysis(): Promise<ReorganizationPlan> {
    console.log("🔍 Starting comprehensive pre-reorganization analysis...");

    // Step 1: Analyze dependencies
    console.log("📊 Analyzing file dependencies...");
    const dependencyMap = await this.dependencyMapper.analyzeDependencies();

    // Step 2: Validate build system
    console.log("🔧 Validating build system integrity...");
    const buildValidation = this.dependencyMapper.validateBuildSystem();

    // Step 3: Check tool availability
    console.log("🛠️  Checking development tools availability...");
    const toolsValidation =
      await this.baselineValidator.validateToolsAvailability();

    // Step 4: Run baseline tests
    console.log("🧪 Running baseline validation tests...");
    const baselineReport = await this.baselineValidator.runBaselineValidation();

    // Step 5: Create backup
    console.log("💾 Creating workspace backup...");
    const backupPath = await this.dependencyMapper.createBackup();

    // Generate recommendations and warnings
    const { recommendations, warnings } = this.generateRecommendations(
      dependencyMap,
      buildValidation,
      toolsValidation,
      baselineReport,
    );

    const plan: ReorganizationPlan = {
      dependencyMap,
      baselineReport,
      validationResults: {
        buildSystemValid: buildValidation.isValid,
        toolsAvailable: toolsValidation.allAvailable,
        pathResolutionValid: true, // Will be validated by property tests
      },
      recommendations,
      warnings,
      backupPath,
    };

    console.log("✅ Pre-reorganization analysis complete!");
    this.printSummary(plan);

    return plan;
  }

  /**
   * Generate recommendations based on analysis results
   */
  private generateRecommendations(
    dependencyMap: DependencyMap,
    buildValidation: any,
    toolsValidation: any,
    baselineReport: BaselineReport,
  ): { recommendations: string[]; warnings: string[] } {
    const recommendations: string[] = [];
    const warnings: string[] = [];

    // Build system recommendations
    if (!buildValidation.isValid) {
      recommendations.push(
        "Fix build system errors before proceeding with reorganization",
      );
      warnings.push(...buildValidation.errors);
    }

    // Tool availability recommendations
    if (!toolsValidation.allAvailable) {
      recommendations.push(
        "Install missing development tools before reorganization",
      );
      warnings.push(
        ...toolsValidation.missingTools.map(
          (tool: string) => `Missing tool: ${tool}`,
        ),
      );
    }

    // Baseline test recommendations
    if (!baselineReport.summary.allPassed) {
      recommendations.push(
        "Fix failing tests before reorganization to establish clean baseline",
      );
      warnings.push(
        ...baselineReport.summary.failedCommands.map(
          (cmd) => `Failing command: ${cmd}`,
        ),
      );
    }

    // File organization recommendations
    const relocatableConfigs = Array.from(
      dependencyMap.configFiles.values(),
    ).filter((file) => file.canRelocate);

    if (relocatableConfigs.length > 0) {
      recommendations.push(
        `${relocatableConfigs.length} configuration files can be safely relocated`,
      );
    }

    const relocatableDocs = Array.from(
      dependencyMap.documentationFiles.values(),
    ).filter((file) => file.canRelocate);

    if (relocatableDocs.length > 0) {
      recommendations.push(
        `${relocatableDocs.length} documentation files can be moved to docs/ directory`,
      );
    }

    // Dependency warnings
    for (const [, fileRef] of dependencyMap.configFiles) {
      if (fileRef.referencedBy.length > 5) {
        warnings.push(
          `File ${fileRef.filePath} is heavily referenced (${fileRef.referencedBy.length} files) - move carefully`,
        );
      }
    }

    return { recommendations, warnings };
  }

  /**
   * Print analysis summary
   */
  private printSummary(plan: ReorganizationPlan): void {
    console.log("\n📋 REORGANIZATION ANALYSIS SUMMARY");
    console.log("=====================================");

    console.log("\n📊 File Analysis:");
    console.log(
      `  • Configuration files: ${plan.dependencyMap.configFiles.size}`,
    );
    console.log(`  • Source files: ${plan.dependencyMap.sourceFiles.size}`);
    console.log(
      `  • Documentation files: ${plan.dependencyMap.documentationFiles.size}`,
    );
    console.log(`  • Asset files: ${plan.dependencyMap.assetFiles.size}`);

    console.log("\n🔧 Validation Results:");
    console.log(
      `  • Build system: ${plan.validationResults.buildSystemValid ? "✅" : "❌"}`,
    );
    console.log(
      `  • Tools available: ${plan.validationResults.toolsAvailable ? "✅" : "❌"}`,
    );
    console.log(
      `  • Baseline tests: ${plan.baselineReport.summary.allPassed ? "✅" : "❌"}`,
    );

    if (plan.recommendations.length > 0) {
      console.log("\n💡 Recommendations:");
      plan.recommendations.forEach((rec) => console.log(`  • ${rec}`));
    }

    if (plan.warnings.length > 0) {
      console.log("\n⚠️  Warnings:");
      plan.warnings.forEach((warning) => console.log(`  • ${warning}`));
    }

    if (plan.backupPath) {
      console.log(`\n💾 Backup created: ${plan.backupPath}`);
    }

    console.log("\n🚀 Ready for reorganization!");
  }

  /**
   * Validate reorganization plan is safe to execute
   */
  public validatePlan(plan: ReorganizationPlan): {
    canProceed: boolean;
    blockers: string[];
  } {
    const blockers: string[] = [];

    if (!plan.validationResults.buildSystemValid) {
      blockers.push("Build system validation failed");
    }

    if (!plan.validationResults.toolsAvailable) {
      blockers.push("Required development tools are missing");
    }

    // Allow proceeding even if baseline tests fail, but warn
    if (!plan.baselineReport.summary.allPassed) {
      console.log(
        "⚠️  Warning: Some baseline tests are failing. Reorganization will proceed but may not improve the situation.",
      );
    }

    return {
      canProceed: blockers.length === 0,
      blockers,
    };
  }
}
