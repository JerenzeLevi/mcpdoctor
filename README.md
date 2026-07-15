# mcpdoctor

Diagnose your MCP (Model Context Protocol) server configs: discover, connect, and flag misconfigurations — before your AI assistant tells you something's silently broken.

```
npx mcpdoctor check
```

## Why

MCP is how AI assistants like Claude Code and Claude Desktop connect to external tools — filesystem access, databases, APIs. You configure servers via JSON (`.mcp.json`, `claude_desktop_config.json`), but nothing tells you whether those configs actually work until the assistant behaves strangely. `mcpdoctor` connects to every configured server for real and reports:

- **Startup failures** — wrong command, missing binary, crashed on launch
- **Missing environment variables** referenced in a server's command/args/env
- **Malformed tool schemas** — a tool's `inputSchema` isn't valid JSON Schema
- **Duplicate tool names** across servers, which can cause ambiguous routing
- **Permission heuristics** — tools that look like they grant broad shell/filesystem access (clearly labeled as a heuristic, not a security guarantee)

## Usage

```
npx mcpdoctor check [path]           # defaults to current directory
npx mcpdoctor check --config <file>  # check one config file explicitly
npx mcpdoctor check --html report.html
npx mcpdoctor check --json
npx mcpdoctor check --strict         # exit non-zero on warnings too, not just errors
```

`mcpdoctor` looks for configs at:
- `./.mcp.json`
- `./.claude/settings.json`, `./.claude/settings.local.json`
- `~/.claude.json`
- The Claude Desktop config for your OS

Exit code is `0` if nothing is broken, `1` if any error-severity finding is present (or any warning, with `--strict`) — safe to use as a CI gate.

## Example output

```
┌───────────────┬────────┬─────────┬───────┬──────────┐
│ Server        │ Status │ Latency │ Tools │ Findings │
├───────────────┼────────┼─────────┼───────┼──────────┤
│ filesystem    │ ok     │ 1858ms  │ 14    │ 0        │
│ broken-server │ failed │ 51ms    │ 0     │ 1        │
└───────────────┴────────┴─────────┴───────┴──────────┘

Findings:
  [ERROR] broken-server (startup): MCP error -32000: Connection closed
```

## Scope

Currently supports stdio, SSE, and streamable-HTTP transports. Config discovery is intentionally narrow (Claude Code and Claude Desktop conventions) — if your tool uses a different config location, use `--config` or open an issue.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Adding a new check is just a new function in `src/checks/`; adding a config location is a one-line addition to `src/discovery/discover.ts`.

## License

MIT
