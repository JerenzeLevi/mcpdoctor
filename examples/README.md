# Examples

`sample-project/` contains a `.mcp.json` with two servers you can run `mcpdoctor` against directly:

- `filesystem` — a real, working MCP server (`@modelcontextprotocol/server-filesystem`), useful for seeing a healthy result.
- `broken-server` — deliberately exits immediately, useful for seeing what a failure finding looks like.

```
npx mcpdoctor check examples/sample-project --timeout 30000
```

The first run will take longer since `npx` has to fetch `@modelcontextprotocol/server-filesystem`.
