# mcpdoctor

[![CI](https://github.com/JerenzeLevi/mcpdoctor/actions/workflows/ci.yml/badge.svg)](https://github.com/JerenzeLevi/mcpdoctor/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/mcpdoctor.svg)](https://www.npmjs.com/package/mcpdoctor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Diagnose your MCP (Model Context Protocol) server configs: discover, connect, and flag misconfigurations — before your AI assistant tells you something's silently broken.

<!--
  Record a real terminal demo and drop it here before publishing. Recommended: vhs (https://github.com/charmbracelet/vhs)
    1. Install: `winget install charmbracelet.vhs` (or see the vhs README for your OS)
    2. Create a `demo.tape` file, e.g.:
         Output docs/demo.gif
         Set FontSize 16
         Set Width 900
         Set Height 500
         Type "npx mcpdoctor check examples/sample-project"
         Enter
         Sleep 5s
    3. Run: `vhs demo.tape`
    4. Replace the line below with: ![mcpdoctor demo](./docs/demo.gif)
-->
![mcpdoctor demo](https://media.tenor.com/Iz8FXtDpnxEAAAAM/the-doctor-is-here-doctor-quack.gif)

```
npx mcpdoctor check
```

## What is this, in plain English?

If you use an AI assistant like Claude that can plug into external tools (reading files, calling APIs, using a database, etc.), that connection is set up through something called **MCP** — a small JSON config file tells the assistant "here's a tool you can use, here's how to start it."

The problem: nobody checks that config file for you. If a tool is missing a password it needs, or was set up with a typo, or crashes on startup — you usually don't find out until your AI assistant mysteriously can't do something, with no clear error message.

**mcpdoctor is a "does this actually work?" checker for those configs.** You run one command, and it:
1. Finds your MCP tool configs automatically.
2. Actually tries to start/connect to each one for real (not just "does the file look okay").
3. Tells you, in plain language, what's broken and why — a missing password, a tool that crashed, two tools with conflicting names, etc.

Think of it like running a health checkup on your AI assistant's toolbelt before you rely on it.

## Why it exists

MCP adoption has exploded, but there's no dominant tool yet that validates these configs are correct, reachable, and safe. `mcpdoctor` connects to every configured server for real and reports:

- **Startup failures** — wrong command, missing binary, crashed on launch
- **Missing environment variables** referenced in a server's command/args/env
- **Malformed tool schemas** — a tool's `inputSchema` isn't valid JSON Schema
- **Duplicate tool names** across servers, which can cause ambiguous routing
- **Permission heuristics** — tools that look like they grant broad shell/filesystem access (clearly labeled as a heuristic, not a security guarantee — see [Scope](#scope))

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

The "permission heuristic" check is exactly that: a heuristic. It flags tools that *look* like they might allow broad shell/filesystem access based on naming patterns, so you know to go double-check them yourself — it is not a security scanner and doesn't guarantee anything about a tool's real behavior.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Adding a new check is just a new function in `src/checks/`; adding a config location is a one-line addition to `src/discovery/discover.ts`.

## License

MIT
