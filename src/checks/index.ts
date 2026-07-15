import type { ServerConfig } from "../discovery/types.js";
import type { ConnectionResult } from "../connect/types.js";
import type { Finding } from "./types.js";
import { startupCheck } from "./startupCheck.js";
import { envCheck } from "./envCheck.js";
import { schemaCheck } from "./schemaCheck.js";
import { duplicateToolCheck } from "./duplicateToolCheck.js";
import { permissionCheck } from "./permissionCheck.js";

export * from "./types.js";
export { startupCheck, envCheck, schemaCheck, duplicateToolCheck, permissionCheck };

/**
 * Runs all checks over the aggregated discovery + connection results.
 * Adding a new check is just a new function registered here — no plugin
 * system needed until real users ask for custom rules (see plan risks).
 */
export function runAllChecks(
  servers: ServerConfig[],
  results: ConnectionResult[],
): Finding[] {
  return [
    ...startupCheck(results),
    ...envCheck(servers, results),
    ...schemaCheck(results),
    ...duplicateToolCheck(results),
    ...permissionCheck(results),
  ];
}
