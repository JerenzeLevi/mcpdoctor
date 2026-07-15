import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseMcpServersFile } from "../../src/discovery/parsers.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, "..", "fixtures", "configs");

describe("parseMcpServersFile", () => {
  it("parses a valid config into normalized ServerConfig entries", () => {
    const contents = readFileSync(join(fixturesDir, "valid.mcp.json"), "utf-8");
    const servers = parseMcpServersFile(contents, "valid.mcp.json");

    expect(servers).toEqual([
      {
        name: "demo",
        transport: "stdio",
        command: "node",
        args: ["server.js"],
        env: { API_KEY: "test" },
        url: undefined,
        sourceFile: "valid.mcp.json",
      },
    ]);
  });

  it("infers sse transport when a url is present without explicit transport", () => {
    const contents = JSON.stringify({
      mcpServers: { remote: { url: "https://example.com/mcp" } },
    });
    const servers = parseMcpServersFile(contents, "remote.json");

    expect(servers[0].transport).toBe("sse");
  });

  it("throws on malformed config shape", () => {
    const contents = readFileSync(join(fixturesDir, "malformed.mcp.json"), "utf-8");
    expect(() => parseMcpServersFile(contents, "malformed.mcp.json")).toThrow();
  });
});
