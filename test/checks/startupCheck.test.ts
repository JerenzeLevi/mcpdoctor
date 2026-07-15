import { describe, it, expect } from "vitest";
import { startupCheck } from "../../src/checks/startupCheck.js";
import type { ConnectionResult } from "../../src/connect/types.js";

function makeResult(overrides: Partial<ConnectionResult>): ConnectionResult {
  return {
    serverName: "demo",
    sourceFile: "test.mcp.json",
    success: true,
    latencyMs: 100,
    tools: [],
    ...overrides,
  };
}

describe("startupCheck", () => {
  it("flags a failed connection as an error", () => {
    const findings = startupCheck([
      makeResult({ success: false, error: "spawn failed" }),
    ]);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe("error");
    expect(findings[0].message).toBe("spawn failed");
  });

  it("flags a slow but successful connection as a warning", () => {
    const findings = startupCheck([makeResult({ latencyMs: 5000 })]);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe("warn");
  });

  it("produces no findings for a fast, successful connection", () => {
    const findings = startupCheck([makeResult({ latencyMs: 200 })]);
    expect(findings).toHaveLength(0);
  });
});
