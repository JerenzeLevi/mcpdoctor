import type { ConnectionResult } from "../connect/types.js";
import type { Finding } from "./types.js";

const SLOW_STARTUP_THRESHOLD_MS = 3000;

/**
 * Flags servers that failed to start/connect (error) or that started
 * slowly enough to be worth calling out (warn).
 */
export function startupCheck(results: ConnectionResult[]): Finding[] {
  const findings: Finding[] = [];

  for (const result of results) {
    if (!result.success) {
      findings.push({
        severity: "error",
        check: "startup",
        serverName: result.serverName,
        sourceFile: result.sourceFile,
        message: result.error ?? "Server failed to start or connect",
      });
      continue;
    }

    if (result.latencyMs > SLOW_STARTUP_THRESHOLD_MS) {
      findings.push({
        severity: "warn",
        check: "startup",
        serverName: result.serverName,
        sourceFile: result.sourceFile,
        message: `Slow startup: ${result.latencyMs}ms (threshold ${SLOW_STARTUP_THRESHOLD_MS}ms)`,
      });
    }
  }

  return findings;
}
