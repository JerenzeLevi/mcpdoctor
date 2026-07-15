# Changelog

All notable changes to this project are documented in this file.

## [0.1.0] - Unreleased

### Added
- `mcpdoctor check` command: discovers `.mcp.json` / `.claude/settings.json` / Claude Desktop configs and connects to each configured server.
- Support for stdio, SSE, and streamable-HTTP transports.
- Checks: startup failure/latency, missing environment variables, malformed tool `inputSchema`, duplicate tool names across servers, and a permission heuristic for broad shell/filesystem access.
- Terminal, HTML (`--html`), and JSON (`--json`) report output.
- `--strict` flag to also fail on warning-severity findings.
