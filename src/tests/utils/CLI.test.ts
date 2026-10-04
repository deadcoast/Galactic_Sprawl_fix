/**
 * @file CLI.test.ts
 *
 * Tests for the CLI functionality
 */

import { describe, it, expect, vi } from "vitest";

// Mock console.log to capture output
const mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
const mockConsoleError = vi
  .spyOn(console, "error")
  .mockImplementation(() => {});

// Mock the FileClassificationSystem
vi.mock("../../utils/dependency-mapping/FileClassificationSystem", () => ({
  FileClassificationSystem: vi.fn().mockImplementation(() => ({
    generateReorganizationPlan: vi.fn().mockResolvedValue({
      relocatableFiles: [
        {
          path: ".prettierrc",
          category: "build-config",
          proposedNewPath: "config/build/.prettierrc",
          toolsAffected: ["prettier"],
        },
      ],
      criticalFiles: [
        {
          path: "package.json",
          category: "critical-config",
          reason: "Critical file that must remain in root",
          toolsAffected: [],
        },
      ],
      validationSuite: {
        preMove: [{ name: "baseline-build" }],
        duringMove: [{ name: "incremental-build" }],
        postMove: [{ name: "final-build" }],
      },
      estimatedOperations: 1,
    }),
  })),
}));

describe("CLI Functionality", () => {
  beforeEach(() => {
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
  });

  it("should run analysis and display results", async () => {
    // Import and run the main function
    const { main } = await import("../../utils/dependency-mapping/cli");

    await main();

    // Verify that console.log was called with expected content
    expect(mockConsoleLog).toHaveBeenCalled();

    // Check for key output messages
    const logCalls = mockConsoleLog.mock.calls.map((call) => call[0]);
    const allOutput = logCalls.join(" ");

    expect(allOutput).toContain("Root Directory Organization");
    expect(allOutput).toContain("Analyzing project structure");
    expect(allOutput).toContain("Analysis Results");
    expect(allOutput).toContain("Critical Files");
    expect(allOutput).toContain("Relocatable Files");
    expect(allOutput).toContain("Validation Test Suite");
    expect(allOutput).toContain("Analysis complete");
  });

  it("should display file classification information", async () => {
    const { main } = await import("../../utils/dependency-mapping/cli");

    await main();

    const logCalls = mockConsoleLog.mock.calls.map((call) => call[0]);
    const allOutput = logCalls.join(" ");

    // Should show relocatable files count
    expect(allOutput).toContain("Relocatable files: 1");

    // Should show critical files count
    expect(allOutput).toContain("Critical files: 1");

    // Should show estimated operations
    expect(allOutput).toContain("Estimated operations: 1");
  });

  it("should display validation test suite information", async () => {
    const { main } = await import("../../utils/dependency-mapping/cli");

    await main();

    const logCalls = mockConsoleLog.mock.calls.map((call) => call[0]);
    const allOutput = logCalls.join(" ");

    // Should show test counts
    expect(allOutput).toContain("Pre-move tests: 1");
    expect(allOutput).toContain("During-move tests: 1");
    expect(allOutput).toContain("Post-move tests: 1");
  });
});
