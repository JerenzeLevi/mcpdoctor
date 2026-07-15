#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { writeFile } from "node:fs/promises";
import { discoverConfigs } from "./discovery/discover.js";
import { connectServer } from "./connect/connectServer.js";
import { runAllChecks } from "./checks/index.js";
import { renderTerminalReport } from "./report/terminalReport.js";
import { renderHtmlReport } from "./report/htmlReport.js";
import type { ConnectionResult } from "./connect/types.js";
import type { ServerConfig } from "./discovery/types.js";

const program = new Command();

program
  .name("mcpdoctor")
  .description("Diagnose your MCP server configs: discover, connect, and flag misconfigurations")
  .version("0.1.0");

program
  .command("check")
  .description("Check MCP servers configured for a project")
  .argument("[path]", "project directory to check", ".")
  .option("--config <path>", "explicit config file path to check instead of auto-discovery")
  .option("--timeout <ms>", "per-server connection timeout in milliseconds", "10000")
  .option("--strict", "exit non-zero on warnings too, not just errors", false)
  .option("--json", "output machine-readable JSON instead of a terminal report", false)
  .option("--html <path>", "also write a static HTML report to this path")
  .action(
    async (
      path: string,
      options: {
        config?: string;
        timeout: string;
        strict: boolean;
        json: boolean;
        html?: string;
      },
    ) => {
      const discovered = await discoverConfigs(path, options.config);

      if (discovered.length === 0) {
        if (options.json) {
          console.log(JSON.stringify({ results: [], findings: [] }, null, 2));
        } else {
          console.log(chalk.yellow("No MCP server configs found."));
        }
        return;
      }

      const allServers: ServerConfig[] = discovered.flatMap((d) => d.servers);
      const allResults: ConnectionResult[] = [];

      for (const server of allServers) {
        allResults.push(await connectServer(server, Number(options.timeout)));
      }

      const findings = runAllChecks(allServers, allResults);

      if (options.json) {
        console.log(JSON.stringify({ results: allResults, findings }, null, 2));
      } else {
        console.log(renderTerminalReport(allResults, findings));
      }

      if (options.html) {
        await writeFile(options.html, renderHtmlReport(allResults, findings), "utf-8");
        if (!options.json) {
          console.log(chalk.dim(`\nHTML report written to ${options.html}`));
        }
      }

      const hasError = findings.some((f) => f.severity === "error");
      const hasWarn = findings.some((f) => f.severity === "warn");
      process.exitCode = hasError || (options.strict && hasWarn) ? 1 : 0;
    },
  );

program.parseAsync(process.argv);
