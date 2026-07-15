import type { ConnectionResult } from "../connect/types.js";
import type { Finding } from "../checks/types.js";

const SEVERITY_ORDER: Record<Finding["severity"], number> = { error: 0, warn: 1, info: 2 };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function findingCountFor(results: ConnectionResult, findings: Finding[]): number {
  return findings.filter(
    (f) => f.serverName === results.serverName && f.sourceFile === results.sourceFile,
  ).length;
}

/**
 * Renders a self-contained static HTML report (no external assets) — good
 * for sharing as a link or CI artifact. Mirrors the terminal report's data,
 * not a separate source of truth.
 */
export function renderHtmlReport(
  results: ConnectionResult[],
  findings: Finding[],
): string {
  const sortedFindings = [...findings].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );

  const rows = results
    .map((r) => {
      const count = findingCountFor(r, findings);
      return `<tr>
        <td>${escapeHtml(r.serverName)}</td>
        <td class="${r.success ? "ok" : "failed"}">${r.success ? "ok" : "failed"}</td>
        <td>${r.latencyMs}ms</td>
        <td>${r.tools.length}</td>
        <td>${count}</td>
      </tr>`;
    })
    .join("\n");

  const findingItems = sortedFindings
    .map(
      (f) => `<li class="sev-${f.severity}">
        <span class="badge">${f.severity.toUpperCase()}</span>
        <strong>${escapeHtml(f.serverName)}</strong> (${escapeHtml(f.check)}): ${escapeHtml(f.message)}
      </li>`,
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>mcpdoctor report</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 2rem; color: #1a1a1a; background: #fff; }
  h1 { font-size: 1.4rem; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 1.5rem; }
  th, td { border: 1px solid #ddd; padding: 0.5rem 0.75rem; text-align: left; }
  th { background: #f5f5f5; }
  td.ok { color: #1a7f37; font-weight: 600; }
  td.failed { color: #cf222e; font-weight: 600; }
  ul { list-style: none; padding: 0; }
  li { padding: 0.5rem 0; border-bottom: 1px solid #eee; }
  .badge { display: inline-block; min-width: 3.5rem; text-align: center; border-radius: 4px; padding: 0.1rem 0.4rem; margin-right: 0.5rem; font-size: 0.75rem; font-weight: 700; }
  .sev-error .badge { background: #ffebe9; color: #cf222e; }
  .sev-warn .badge { background: #fff8c5; color: #9a6700; }
  .sev-info .badge { background: #eef2ff; color: #3538cd; }
  @media (prefers-color-scheme: dark) {
    body { background: #0d1117; color: #e6edf3; }
    th { background: #161b22; }
    th, td { border-color: #30363d; }
    li { border-color: #21262d; }
  }
</style>
</head>
<body>
<h1>mcpdoctor report</h1>
<table>
  <thead><tr><th>Server</th><th>Status</th><th>Latency</th><th>Tools</th><th>Findings</th></tr></thead>
  <tbody>
${rows}
  </tbody>
</table>
${sortedFindings.length > 0 ? `<h2>Findings</h2><ul>\n${findingItems}\n</ul>` : "<p>No findings.</p>"}
</body>
</html>
`;
}
