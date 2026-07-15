import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { discoverConfigs, candidatePaths } from "../../src/discovery/discover.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, "..", "fixtures", "configs");

describe("discoverConfigs", () => {
  it("returns an empty list when no config files exist at candidate paths", async () => {
    const discovered = await discoverConfigs(join(__dirname, "nonexistent-project"));
    expect(discovered).toEqual([]);
  });

  it("parses an explicit config path when provided", async () => {
    const explicitPath = join(fixturesDir, "valid.mcp.json");
    const discovered = await discoverConfigs(".", explicitPath);

    expect(discovered).toHaveLength(1);
    expect(discovered[0].servers).toHaveLength(1);
    expect(discovered[0].servers[0].name).toBe("demo");
  });
});

describe("candidatePaths", () => {
  it("includes the project-local .mcp.json and .claude/settings.json paths", () => {
    const paths = candidatePaths("/some/project");
    expect(paths).toContain(join("/some/project", ".mcp.json"));
    expect(paths).toContain(join("/some/project", ".claude", "settings.json"));
  });
});
