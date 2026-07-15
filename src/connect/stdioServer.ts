import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { ServerConfig } from "../discovery/types.js";
import type { ConnectionResult } from "./types.js";

const DEFAULT_TIMEOUT_MS = 10_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}

/**
 * Spawns a stdio MCP server, connects, and lists its tools. Always attempts
 * to close the client/transport even on failure, to avoid leaking child
 * processes (see plan risks: zombie process handling).
 */
export async function connectStdioServer(
  config: ServerConfig,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<ConnectionResult> {
  const start = Date.now();

  if (!config.command) {
    return {
      serverName: config.name,
      sourceFile: config.sourceFile,
      success: false,
      latencyMs: 0,
      tools: [],
      error: "Missing 'command' for stdio server",
    };
  }

  const transport = new StdioClientTransport({
    command: config.command,
    args: config.args ?? [],
    env: { ...process.env, ...config.env } as Record<string, string>,
  });

  const client = new Client(
    { name: "mcpdoctor", version: "0.1.0" },
    { capabilities: {} },
  );

  try {
    await withTimeout(client.connect(transport), timeoutMs, `Connecting to ${config.name}`);
    const { tools } = await withTimeout(
      client.listTools(),
      timeoutMs,
      `Listing tools for ${config.name}`,
    );

    return {
      serverName: config.name,
      sourceFile: config.sourceFile,
      success: true,
      latencyMs: Date.now() - start,
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    };
  } catch (err) {
    return {
      serverName: config.name,
      sourceFile: config.sourceFile,
      success: false,
      latencyMs: Date.now() - start,
      tools: [],
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    try {
      await client.close();
    } catch {
      // best-effort cleanup; nothing further to do if close itself fails
    }
  }
}
