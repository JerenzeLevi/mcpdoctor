import type { ServerConfig } from "../discovery/types.js";
import type { ConnectionResult } from "./types.js";
import { connectStdioServer } from "./stdioServer.js";
import { connectHttpServer } from "./httpServer.js";

/**
 * Dispatches to the appropriate transport handler.
 */
export async function connectServer(
  config: ServerConfig,
  timeoutMs?: number,
): Promise<ConnectionResult> {
  if (config.transport === "stdio") {
    return connectStdioServer(config, timeoutMs);
  }

  return connectHttpServer(config, timeoutMs);
}
