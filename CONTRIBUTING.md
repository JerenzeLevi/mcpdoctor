# Contributing to mcpdoctor

## Setup

```
npm install
npm run test:watch   # vitest in watch mode
npm run dev -- check ./examples/sample-project
```

## Project layout

- `src/discovery/` — finds and parses MCP config files. Pure filesystem + parsing, no network/process calls.
- `src/connect/` — connects to a configured server (stdio, SSE, streamable-HTTP) and lists its tools. The only layer that spawns processes or makes network calls.
- `src/checks/` — pure functions `(servers, results) => Finding[]`. No side effects.
- `src/report/` — renders findings as a terminal table, static HTML, or JSON.

## Adding a check

A check is a plain function that takes discovered servers and/or connection results and returns `Finding[]`. Add it to `src/checks/`, export it from `src/checks/index.ts`, and add it to the list in `runAllChecks`. No plugin system needed — see an existing check like `src/checks/duplicateToolCheck.ts` for the shape.

## Adding a config discovery location

Add the path to `candidatePaths()` in `src/discovery/discover.ts`. If the file uses a different top-level shape than `{ mcpServers: {...} }`, add a parser alongside `parseMcpServersFile` in `src/discovery/parsers.ts`.

## Tests

Checks and discovery are unit-tested with synthetic fixtures — please don't add tests that spawn real MCP server packages or make network calls; that leads to flaky, slow CI. See `test/fixtures/configs/` for the fixture pattern.

## Before submitting a PR

```
npm run typecheck
npm run lint
npm test
```
