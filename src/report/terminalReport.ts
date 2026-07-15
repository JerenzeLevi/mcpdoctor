import chalk from "chalk";
import Table from "cli-table3";
import type { ConnectionResult } from "../connect/types.js";
import type { Finding } from "../checks/types.js";

const SEVERITY_ORDER: Record<Finding["severity"], number> = { error: 0, warn: 1, info: 2 };

function severityLabel(severity: Finding["severity"]): string {
  switch (severity) {
    case "error":
      return chalk.red("ERROR");
    case "warn":
      return chalk.yellow("WARN");
    case "info":
      return chalk.dim("INFO");
  }
}

/**
 * Renders a colored summary table (one row per server) plus a findings list,
 * sorted by severity so the most important problems surface first.
 */
export function renderTerminalReport(
  results: ConnectionResult[],
  findings: Finding[],
): string {
  const lines: string[] = [];

  const table = new Table({
    head: ["Server", "Status", "Latency", "Tools", "Findings"],
  });

  for (const result of results) {
    const findingCount = findings.filter(
      (f) => f.serverName === result.serverName && f.sourceFile === result.sourceFile,
    ).length;

    table.push([
      result.serverName,
      result.success ? chalk.green("ok") : chalk.red("failed"),
      `${result.latencyMs}ms`,
      String(result.tools.length),
      findingCount > 0 ? chalk.yellow(String(findingCount)) : "0",
    ]);
  }

  lines.push(table.toString());

  const sorted = [...findings].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );

  if (sorted.length > 0) {
    lines.push("");
    lines.push(chalk.bold("Findings:"));
    for (const finding of sorted) {
      lines.push(
        `  [${severityLabel(finding.severity)}] ${finding.serverName} (${finding.check}): ${finding.message}`,
      );
    }
  }

  return lines.join("\n");
}
