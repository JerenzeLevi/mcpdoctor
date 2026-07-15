import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
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
 * Connects to an SSE or streamable-HTTP MCP server and lists its tools.
 * Tries streamable HTTP first (the current spec's preferred transport) and
 * falls back to legacy SSE on failure, mirroring the MCP SDK's own
 * recommended client negotiation pattern.
 */
export async function connectHttpServer(
  config: ServerConfig,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<ConnectionResult> {
  const start = Date.now();

  if (!config.url) {
    return {
      serverName: config.name,
      sourceFile: config.sourceFile,
      success: false,
      latencyMs: 0,
      tools: [],
      error: "Missing 'url' for http/sse server",
    };
  }

  const url = new URL(config.url);
  const attempts =
    config.transport === "sse"
      ? [() => new SSEClientTransport(url)]
      : [
          () => new StreamableHTTPClientTransport(url),
          () => new SSEClientTransport(url),
        ];

  let lastError: string | undefined;

  for (const makeTransport of attempts) {
    const client = new Client({ name: "mcpdoctor", version: "0.1.0" }, { capabilities: {} });
    try {
      const transport = makeTransport();
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
      lastError = err instanceof Error ? err.message : String(err);
    } finally {
      try {
        await client.close();
      } catch {
        // best-effort cleanup
      }
    }
  }

  return {
    serverName: config.name,
    sourceFile: config.sourceFile,
    success: false,
    latencyMs: Date.now() - start,
    tools: [],
    error: lastError ?? "Failed to connect via http/sse",
  };
}
