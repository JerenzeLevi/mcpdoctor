export interface ToolInfo {
  name: string;
  description?: string;
  inputSchema: unknown;
}

export interface ConnectionResult {
  serverName: string;
  sourceFile: string;
  success: boolean;
  latencyMs: number;
  tools: ToolInfo[];
  error?: string;
}
