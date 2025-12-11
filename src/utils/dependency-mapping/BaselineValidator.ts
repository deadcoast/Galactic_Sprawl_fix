/**
 * @file BaselineValidator.ts
 * 
 * Establishes baseline test results for build, lint, type-check, and test suites
 * before directory reorganization.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export interface BaselineResult {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  timestamp: Date;
  duration: number;
}

export interface BaselineReport {
  build: BaselineResult;
  typeCheck: BaselineResult;
  lint: BaselineResult;
  test: BaselineResult;
  summary: {
    allPassed: boolean;
    failedCommands: string[];
    totalDuration: number;
  };
}

export class BaselineValidator {
  private rootDir: string;
  private reportPath: string;

  constructor(rootDir: string = process.cwd()) {
    this.rootDir = rootDir;
    this.reportPath = path.join(rootDir, 'baseline-report.json');
  }

  /**
   * Run all baseline validation commands
   */
  public async runBaselineValidation(): Promise<BaselineReport> {
    const commands = [
      { name: 'build', command: 'npm run build' },
      { name: 'typeCheck', command: 'npm run type-check' },
      { name: 'lint', command: 'npm run lint' },
      { name: 'test', command: 'npm run test -- --run' }
    ];

    const results: Record<string, BaselineResult> = {};
    const failedCommands: string[] = [];
    let totalDuration = 0;

    for (const { name, command } of commands) {
      console.log(`Running baseline validation: ${command}`);
      const result = await this.runCommand(command);
      results[name] = result;
      totalDuration += result.duration;

      if (result.exitCode !== 0) {
        failedCommands.push(name);
      }
    }

    const report: BaselineReport = {
      build: results.build,
      typeCheck: results.typeCheck,
      lint: results.lint,
      test: results.test,
      summary: {
        allPassed: failedCommands.length === 0,
        failedCommands,
        totalDuration
      }
    };

    // Save report to file
    await this.saveReport(report);
    
    return report;
  }

  /**
   * Run a single command and capture results
   */
  public async runCommand(command: string): Promise<BaselineResult> {
    const startTime = Date.now();
    let exitCode = 0;
    let stdout = '';
    let stderr = '';

    try {
      const result = execSync(command, {
        cwd: this.rootDir,
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      stdout = result.toString();
    } catch (error: any) {
      exitCode = error.status || 1;
      stdout = error.stdout?.toString() || '';
      stderr = error.stderr?.toString() || error.message;
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    return {
      command,
      exitCode,
      stdout,
      stderr,
      timestamp: new Date(startTime),
      duration
    };
  }

  /**
   * Save baseline report to file
   */
  private async saveReport(report: BaselineReport): Promise<void> {
    const reportJson = JSON.stringify(report, null, 2);
    await fs.promises.writeFile(this.reportPath, reportJson, 'utf-8');
    console.log(`Baseline report saved to: ${this.reportPath}`);
  }

  /**
   * Load existing baseline report
   */
  public async loadBaselineReport(): Promise<BaselineReport | null> {
    try {
      const reportJson = await fs.promises.readFile(this.reportPath, 'utf-8');
      return JSON.parse(reportJson);
    } catch (error) {
      return null;
    }
  }

  /**
   * Compare current results with baseline
   */
  public async compareWithBaseline(): Promise<{
    hasRegression: boolean;
    differences: string[];
    currentReport: BaselineReport;
    baselineReport: BaselineReport | null;
  }> {
    const baselineReport = await this.loadBaselineReport();
    const currentReport = await this.runBaselineValidation();
    
    if (!baselineReport) {
      return {
        hasRegression: false,
        differences: ['No baseline report found'],
        currentReport,
        baselineReport: null
      };
    }

    const differences: string[] = [];
    let hasRegression = false;

    // Compare each command result
    const commands = ['build', 'typeCheck', 'lint', 'test'] as const;
    
    for (const command of commands) {
      const baseline = baselineReport[command];
      const current = currentReport[command];

      if (baseline.exitCode === 0 && current.exitCode !== 0) {
        differences.push(`${command}: Regression detected (was passing, now failing)`);
        hasRegression = true;
      } else if (baseline.exitCode !== 0 && current.exitCode === 0) {
        differences.push(`${command}: Improvement detected (was failing, now passing)`);
      }

      // Check for significant duration changes (>50% increase)
      const durationIncrease = (current.duration - baseline.duration) / baseline.duration;
      if (durationIncrease > 0.5) {
        differences.push(`${command}: Significant performance regression (${Math.round(durationIncrease * 100)}% slower)`);
      }
    }

    return {
      hasRegression,
      differences,
      currentReport,
      baselineReport
    };
  }

  /**
   * Validate that all critical tools are working
   */
  public async validateToolsAvailability(): Promise<{
    allAvailable: boolean;
    missingTools: string[];
    toolVersions: Record<string, string>;
  }> {
    const tools = [
      { name: 'node', command: 'node --version' },
      { name: 'npm', command: 'npm --version' },
      { name: 'tsc', command: 'npx tsc --version' },
      { name: 'vite', command: 'npx vite --version' },
      { name: 'eslint', command: 'npx eslint --version' },
      { name: 'prettier', command: 'npx prettier --version' },
      { name: 'vitest', command: 'npx vitest --version' }
    ];

    const missingTools: string[] = [];
    const toolVersions: Record<string, string> = {};

    for (const tool of tools) {
      try {
        const result = execSync(tool.command, {
          cwd: this.rootDir,
          encoding: 'utf-8',
          stdio: 'pipe'
        });
        toolVersions[tool.name] = result.toString().trim();
      } catch (error) {
        missingTools.push(tool.name);
        toolVersions[tool.name] = 'Not available';
      }
    }

    return {
      allAvailable: missingTools.length === 0,
      missingTools,
      toolVersions
    };
  }
}