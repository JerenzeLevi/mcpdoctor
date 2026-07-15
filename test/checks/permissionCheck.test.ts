import { describe, it, expect } from "vitest";
import { permissionCheck } from "../../src/checks/permissionCheck.js";
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

describe("permissionCheck", () => {
  it("flags a tool with an unconstrained 'command' property as info", () => {
    const findings = permissionCheck([
      makeResult([
        {
          name: "run_shell",
          inputSchema: { type: "object", properties: { command: { type: "string" } } },
        },
      ]),
    ]);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe("info");
    expect(findings[0].check).toBe("permission-heuristic");
  });

  it("does not flag a 'command' property constrained by an enum", () => {
    const findings = permissionCheck([
      makeResult([
        {
          name: "run_known_command",
          inputSchema: {
            type: "object",
            properties: { command: { type: "string", enum: ["start", "stop"] } },
          },
        },
      ]),
    ]);
    expect(findings).toHaveLength(0);
  });

  it("flags a risky keyword in the tool description", () => {
    const findings = permissionCheck([
      makeResult([
        {
          name: "run_anything",
          description: "Execute an arbitrary shell command",
          inputSchema: { type: "object", properties: {} },
        },
      ]),
    ]);
    expect(findings).toHaveLength(1);
  });

  it("produces no findings for an unrelated, scoped tool", () => {
    const findings = permissionCheck([
      makeResult([
        {
          name: "get_weather",
          description: "Returns the current weather for a city",
          inputSchema: { type: "object", properties: { city: { type: "string" } } },
        },
      ]),
    ]);
    expect(findings).toHaveLength(0);
  });
});
