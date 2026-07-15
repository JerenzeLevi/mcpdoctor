import { describe, it, expect } from "vitest";
import { duplicateToolCheck } from "../../src/checks/duplicateToolCheck.js";
import type { ConnectionResult } from "../../src/connect/types.js";

describe("duplicateToolCheck", () => {
  it("flags a tool name exposed by more than one server", () => {
    const results: ConnectionResult[] = [
      {
        serverName: "server-a",
        sourceFile: "a.mcp.json",
        success: true,
        latencyMs: 10,
        tools: [{ name: "read_file", inputSchema: {} }],
      },
      {
        serverName: "server-b",
        sourceFile: "b.mcp.json",
        success: true,
        latencyMs: 10,
        tools: [{ name: "read_file", inputSchema: {} }],
      },
    ];

    const findings = duplicateToolCheck(results);
    expect(findings).toHaveLength(2);
    expect(findings.every((f) => f.severity === "warn")).toBe(true);
    expect(findings[0].message).toContain("server-b");
    expect(findings[1].message).toContain("server-a");
  });

  it("produces no findings when tool names don't collide", () => {
    const results: ConnectionResult[] = [
      {
        serverName: "server-a",
        sourceFile: "a.mcp.json",
        success: true,
        latencyMs: 10,
        tools: [{ name: "read_file", inputSchema: {} }],
      },
      {
        serverName: "server-b",
        sourceFile: "b.mcp.json",
        success: true,
        latencyMs: 10,
        tools: [{ name: "write_file", inputSchema: {} }],
      },
    ];

    expect(duplicateToolCheck(results)).toHaveLength(0);
  });
});
