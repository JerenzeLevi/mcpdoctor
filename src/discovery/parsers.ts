import { parse as parseJsonc } from "jsonc-parser";
import { z } from "zod";
import type { ServerConfig, Transport } from "./types.js";

const rawServerSchema = z
  .object({
    command: z.string().optional(),
    args: z.array(z.string()).optional(),
    env: z.record(z.string()).optional(),
    url: z.string().optional(),
    transport: z.enum(["stdio", "sse", "http"]).optional(),
  })
  .passthrough();

const mcpConfigSchema = z.object({
  mcpServers: z.record(rawServerSchema).default({}),
});

function inferTransport(raw: z.infer<typeof rawServerSchema>): Transport {
  if (raw.transport) return raw.transport;
  if (raw.url) return "sse";
  return "stdio";
}

/**
 * Parses the contents of a `.mcp.json` or `.claude/settings.json`-style file
 * (both use a top-level `mcpServers` map) into normalized ServerConfig entries.
 */
export function parseMcpServersFile(
  contents: string,
  sourceFile: string,
): ServerConfig[] {
  const parsed: unknown = parseJsonc(contents);
  const result = mcpConfigSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `Invalid MCP config shape in ${sourceFile}: ${result.error.message}`,
    );
  }

  return Object.entries(result.data.mcpServers).map(([name, raw]) => ({
    name,
    transport: inferTransport(raw),
    command: raw.command,
    args: raw.args,
    env: raw.env,
    url: raw.url,
    sourceFile,
  }));
}
