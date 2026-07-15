export type Severity = "error" | "warn" | "info";

export interface Finding {
  severity: Severity;
  check: string;
  serverName: string;
  sourceFile: string;
  message: string;
}
