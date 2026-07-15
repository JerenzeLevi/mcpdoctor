import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join } from "node:path";
import { parseMcpServersFile } from "./parsers.js";
import type { DiscoveredConfig } from "./types.js";

function claudeDesktopConfigPath(): string | undefined {
  const home = homedir();
  switch (platform()) {
    case "darwin":
      return join(
        home,
        "Library",
        "Application Support",
        "Claude",
        "claude_desktop_config.json",
      );
    case "win32":
      return process.env.APPDATA
        ? join(process.env.APPDATA, "Claude", "claude_desktop_config.json")
        : undefined;
    default:
      return join(home, ".config", "Claude", "claude_desktop_config.json");
  }
}

/**
 * Returns the ordered list of candidate config file paths to check for a
 * given project directory. Kept intentionally narrow (v1 scope) — see plan
 * risks section: don't chase every editor's config convention on day one.
 */
export function candidatePaths(projectDir: string): string[] {
  const home = homedir();
  const paths = [
    join(projectDir, ".mcp.json"),
    join(projectDir, ".claude", "settings.json"),
    join(projectDir, ".claude", "settings.local.json"),
    join(home, ".claude.json"),
  ];
  const desktopConfig = claudeDesktopConfigPath();
  if (desktopConfig) paths.push(desktopConfig);
  return paths;
}

/**
 * Discovers and parses MCP server configs for a project directory,
 * checking each known config location (see candidatePaths). Missing files
 * are silently skipped; malformed files raise so problems are surfaced,
 * not swallowed.
 */
export async function discoverConfigs(
  projectDir: string,
  explicitPath?: string,
): Promise<DiscoveredConfig[]> {
  const paths = explicitPath ? [explicitPath] : candidatePaths(projectDir);
  const discovered: DiscoveredConfig[] = [];

  for (const path of paths) {
    if (!existsSync(path)) continue;
    const contents = await readFile(path, "utf-8");
    const servers = parseMcpServersFile(contents, path);
    if (servers.length > 0) {
      discovered.push({ sourceFile: path, servers });
    }
  }

  return discovered;
}
