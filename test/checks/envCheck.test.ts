import { describe, it, expect } from "vitest";
import { envCheck } from "../../src/checks/envCheck.js";
import type { ServerConfig } from "../../src/discovery/types.js";
import type { ConnectionResult } from "../../src/connect/types.js";

function makeServer(overrides: Partial<ServerConfig>): ServerConfig {
  return {
    name: "demo",
    transport: "stdio",
    sourceFile: "test.mcp.json",
    ...overrides,
  };
}

describe("envCheck", () => {
  it("flags a referenced env var that is undefined, as warn when the server failed", () => {
    const server = makeServer({ args: ["--token", "${DEFINITELY_UNDEFINED_VAR_XYZ}"] });
    const result: ConnectionResult = {
      serverName: "demo",
      sourceFile: "test.mcp.json",
      success: false,
      latencyMs: 50,
      tools: [],
      error: "failed",
    };

    const findings = envCheck([server], [result]);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe("warn");
    expect(findings[0].message).toContain("DEFINITELY_UNDEFINED_VAR_XYZ");
  });

  it("downgrades to info when the server actually succeeded despite the missing var", () => {
    const server = makeServer({ args: ["${DEFINITELY_UNDEFINED_VAR_XYZ}"] });
    const result: ConnectionResult = {
      serverName: "demo",
      sourceFile: "test.mcp.json",
      success: true,
      latencyMs: 50,
      tools: [],
    };

    const findings = envCheck([server], [result]);
    expect(findings[0].severity).toBe("info");
  });

  it("produces no findings when there are no variable references", () => {
    const server = makeServer({ args: ["--verbose"] });
    const findings = envCheck([server], []);
    expect(findings).toHaveLength(0);
  });
});
