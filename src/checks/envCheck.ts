import type { ServerConfig } from "../discovery/types.js";
import type { ConnectionResult } from "../connect/types.js";
import type { Finding } from "./types.js";

const VAR_PATTERN = /\$\{(\w+)\}/g;

function referencedVars(config: ServerConfig): string[] {
  const haystack = [
    config.command ?? "",
    ...(config.args ?? []),
    ...Object.values(config.env ?? {}),
  ].join(" ");

  const vars = new Set<string>();
  for (const match of haystack.matchAll(VAR_PATTERN)) {
    vars.add(match[1]);
  }
  return [...vars];
}

/**
 * Flags `${VAR}`-style references in a server's command/args/env that are
 * not present in process.env at check time. Severity depends on whether the
 * server actually failed to start, since a missing var is far more likely
 * to be the root cause in that case.
 */
export function envCheck(
  servers: ServerConfig[],
  results: ConnectionResult[],
): Finding[] {
  const findings: Finding[] = [];
  const resultByServer = new Map(
    results.map((r) => [`${r.sourceFile}::${r.serverName}`, r]),
  );

  for (const server of servers) {
    const missing = referencedVars(server).filter((name) => !(name in process.env));
    if (missing.length === 0) continue;

    const result = resultByServer.get(`${server.sourceFile}::${server.name}`);
    const severity = result && !result.success ? "warn" : "info";

    findings.push({
      severity,
      check: "env",
      serverName: server.name,
      sourceFile: server.sourceFile,
      message: `References undefined environment variable(s): ${missing.join(", ")}`,
    });
  }

  return findings;
}
