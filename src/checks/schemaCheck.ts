import { Ajv } from "ajv";
import AjvFormatsModule from "ajv-formats";
import type { ConnectionResult } from "../connect/types.js";
import type { Finding } from "./types.js";

const addFormats = AjvFormatsModule as unknown as typeof AjvFormatsModule.default;

const ajv = new Ajv({ strict: false });
addFormats(ajv);

/**
 * Validates each connected server's tool inputSchema is itself a valid JSON
 * Schema. Catches malformed schemas that would otherwise silently confuse
 * downstream MCP clients — a real differentiator over just "is it running".
 */
export function schemaCheck(results: ConnectionResult[]): Finding[] {
  const findings: Finding[] = [];

  for (const result of results) {
    if (!result.success) continue;

    for (const tool of result.tools) {
      try {
        ajv.compile(tool.inputSchema as object);
      } catch (err) {
        findings.push({
          severity: "error",
          check: "schema",
          serverName: result.serverName,
          sourceFile: result.sourceFile,
          message: `Tool '${tool.name}' has an invalid inputSchema: ${
            err instanceof Error ? err.message : String(err)
          }`,
        });
      }
    }
  }

  return findings;
}
