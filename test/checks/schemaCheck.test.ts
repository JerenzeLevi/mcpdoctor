import { describe, it, expect } from "vitest";
import { schemaCheck } from "../../src/checks/schemaCheck.js";
import type { ConnectionResult } from "../../src/connect/types.js";

function makeResult(tools: ConnectionResult["tools"]): ConnectionResult {
  return {
    serverName: "demo",
    sourceFile: "test.mcp.json",
    success: true,
    latencyMs: 100,
    tools,
  };
}

describe("schemaCheck", () => {
  it("produces no findings for a valid inputSchema", () => {
    const findings = schemaCheck([
      makeResult([
        { name: "good-tool", inputSchema: { type: "object", properties: {} } },
      ]),
    ]);
    expect(findings).toHaveLength(0);
  });

  it("flags a tool with a malformed inputSchema", () => {
    const findings = schemaCheck([
      makeResult([
        { name: "bad-tool", inputSchema: { type: "not-a-real-type" } },
      ]),
    ]);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe("error");
    expect(findings[0].message).toContain("bad-tool");
  });

  it("skips servers that failed to connect", () => {
    const findings = schemaCheck([
      {
        serverName: "demo",
        sourceFile: "test.mcp.json",
        success: false,
        latencyMs: 10,
        tools: [],
        error: "failed",
      },
    ]);
    expect(findings).toHaveLength(0);
  });
});
