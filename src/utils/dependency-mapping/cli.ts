#!/usr/bin/env node

/**
 * @file cli.ts
 *
 * Command-line interface for the file classification and validation system
 */

import { FileClassificationSystem } from "./FileClassificationSystem";
import { DependencyMapper } from "./DependencyMapper";
import { BaselineValidator } from "./BaselineValidator";

async function main() {
  console.log("🔍 Root Directory Organization - File Classification System");
  console.log("=========================================================\n");

  try {
    const system = new FileClassificationSystem();

    console.log("📊 Analyzing project structure...");
    const plan = await system.generateReorganizationPlan();

    console.log("\n📋 Analysis Results:");
    console.log(`   • Relocatable files: ${plan.relocatableFiles.length}`);
    console.log(`   • Critical files: ${plan.criticalFiles.length}`);
    console.log(`   • Estimated operations: ${plan.estimatedOperations}`);

    console.log("\n🔒 Critical Files (Must Stay in Root):");
    for (const file of plan.criticalFiles) {
      console.log(`   • ${file.path} (${file.category})`);
      if (file.reason) {
        console.log(`     Reason: ${file.reason}`);
      }
      if (file.toolsAffected.length > 0) {
        console.log(`     Tools: ${file.toolsAffected.join(", ")}`);
      }
    }

    console.log("\n📦 Relocatable Files:");
    for (const file of plan.relocatableFiles) {
      console.log(
        `   • ${file.path} → ${file.proposedNewPath} (${file.category})`,
      );
      if (file.toolsAffected.length > 0) {
        console.log(`     Tools: ${file.toolsAffected.join(", ")}`);
      }
    }

    console.log("\n🧪 Validation Test Suite:");
    console.log(`   • Pre-move tests: ${plan.validationSuite.preMove.length}`);
    console.log(
      `   • During-move tests: ${plan.validationSuite.duringMove.length}`,
    );
    console.log(
      `   • Post-move tests: ${plan.validationSuite.postMove.length}`,
    );

    console.log("\n✅ Analysis complete! Ready for reorganization.");
    console.log("\nNext steps:");
    console.log("1. Review the proposed file moves above");
    console.log("2. Run the reorganization tasks from tasks.md");
    console.log("3. Use the validation tests to ensure no regressions");
  } catch (error) {
    console.error("❌ Error during analysis:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { main };
