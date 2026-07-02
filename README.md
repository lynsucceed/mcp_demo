# mcp-demo

A simple stdio MCP server built with the TypeScript SDK.

## Tools

- `add`: Add two numbers.
- `subtract`: Subtract the second number from the first.
- `multiply`: Multiply two numbers.
- `divide`: Divide the first number by the second.

## ModelScope Hosted Deployment

This project is intended to be deployed from a GitHub repository. Use stdio as the MCP transport.

Recommended package scripts:

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/server-stdio.js"
  }
}
```

Recommended ModelScope commands:

Install/build command:

```bash
npm install && npm run build
```

Start command:

```bash
npm start
```

The start script runs the stdio MCP server:

```bash
node dist/server-stdio.js
```

Local MCP config:

```json
{
  "mcpServers": {
    "mcp-demo": {
      "command": "node",
      "args": ["dist/server-stdio.js"]
    }
  }
}
```

This server does not require environment variables.
