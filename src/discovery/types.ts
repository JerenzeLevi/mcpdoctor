export type Transport = "stdio" | "sse" | "http";

export interface ServerConfig {
  name: string;
  transport: Transport;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  sourceFile: string;
}

export interface DiscoveredConfig {
  sourceFile: string;
  servers: ServerConfig[];
}
