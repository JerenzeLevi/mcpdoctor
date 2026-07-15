import type { ConnectionResult } from "../connect/types.js";
import type { Finding } from "./types.js";

/**
 * Flags tool names exposed by more than one successfully connected server —
 * a collision that could cause ambiguous routing in some MCP clients.
 */
export function duplicateToolCheck(results: ConnectionResult[]): Finding[] {
  const owners = new Map<string, ConnectionResult[]>();

  for (const result of results) {
    if (!result.success) continue;
    for (const tool of result.tools) {
      const list = owners.get(tool.name) ?? [];
      list.push(result);
      owners.set(tool.name, list);
    }
  }

  const findings: Finding[] = [];
  for (const [toolName, owningResults] of owners) {
    if (owningResults.length <= 1) continue;
    for (const result of owningResults) {
      findings.push({
        severity: "warn",
        check: "duplicate-tool",
        serverName: result.serverName,
        sourceFile: result.sourceFile,
        message: `Tool '${toolName}' is also exposed by: ${owningResults
          .filter((r) => r !== result)
          .map((r) => r.serverName)
          .join(", ")}`,
      });
    }
  }

  return findings;
}
