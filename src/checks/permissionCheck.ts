import type { ConnectionResult } from "../connect/types.js";
import type { Finding } from "./types.js";

const RISKY_KEYWORDS = ["execute", "shell command", "arbitrary command", "run any"];
// Deliberately excludes "path" — it's a normal parameter name on legitimate
// file-reading tools and produced too many false positives (see CHANGELOG).
const RISKY_PROPERTY_NAMES = ["command", "cmd", "shell"];

function hasUnconstrainedRiskyProperty(schema: unknown): boolean {
  if (typeof schema !== "object" || schema === null) return false;
  const properties = (schema as { properties?: Record<string, unknown> }).properties;
  if (!properties) return false;

  return Object.entries(properties).some(([name, prop]) => {
    if (!RISKY_PROPERTY_NAMES.includes(name.toLowerCase())) return false;
    if (typeof prop !== "object" || prop === null) return true;
    const p = prop as { enum?: unknown; pattern?: unknown };
    return !p.enum && !p.pattern;
  });
}

/**
 * Heuristic-only: flags tools whose schema/description suggests broad
 * filesystem or shell-execution access without scoping. This is explicitly
 * NOT a security guarantee — labeled as a heuristic in the finding message
 * to avoid overclaiming (see plan: don't chase "security scanning" claims).
 */
export function permissionCheck(results: ConnectionResult[]): Finding[] {
  const findings: Finding[] = [];

  for (const result of results) {
    if (!result.success) continue;

    for (const tool of result.tools) {
      const description = tool.description?.toLowerCase() ?? "";
      const keywordHit = RISKY_KEYWORDS.some((word) => description.includes(word));
      const propertyHit = hasUnconstrainedRiskyProperty(tool.inputSchema);

      if (keywordHit || propertyHit) {
        findings.push({
          severity: "info",
          check: "permission-heuristic",
          serverName: result.serverName,
          sourceFile: result.sourceFile,
          message: `Tool '${tool.name}' looks like it may allow broad shell/filesystem access (heuristic, not a security guarantee) — review its scope`,
        });
      }
    }
  }

  return findings;
}
