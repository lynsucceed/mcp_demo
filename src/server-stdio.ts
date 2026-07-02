#!/usr/bin/env node

import { z } from "zod";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

type Operation = (a: number, b: number) => number;

interface MathToolConfig {
  name: string;
  description: string;
  operation: Operation;
  validate?: (a: number, b: number) => void;
}

const server = new McpServer({
  name: "mcp-demo",
  version: "1.0.0",
});

const createTextResponse = (text: string) => ({
  content: [{ type: "text" as const, text }],
});

const registerMathTool = ({ name, description, operation, validate }: MathToolConfig) => {
  server.tool(
    name,
    description,
    { a: z.number(), b: z.number() },
    async ({ a, b }) => {
      if (validate) {
        validate(a, b);
      }

      return createTextResponse(String(operation(a, b)));
    }
  );
};

const mathTools: MathToolConfig[] = [
  {
    name: "add",
    description: "Add two numbers.",
    operation: (a, b) => a + b,
  },
  {
    name: "subtract",
    description: "Subtract the second number from the first.",
    operation: (a, b) => a - b,
  },
  {
    name: "multiply",
    description: "Multiply two numbers.",
    operation: (a, b) => a * b,
  },
  {
    name: "divide",
    description: "Divide the first number by the second.",
    operation: (a, b) => a / b,
    validate: (_a, b) => {
      if (b === 0) {
        throw new Error("Division by zero is not allowed");
      }
    },
  },
];

mathTools.forEach(registerMathTool);

server.resource("testing", "testing://testing", async (uri) => ({
  contents: [{ uri: uri.href, text: "Testing Succeed!" }],
}));

server.resource(
  "greeting",
  new ResourceTemplate("greeting://greeting/{name}", { list: undefined }),
  async (uri, variables) => ({
    contents: [{ uri: uri.href, text: `Hello, ${String(variables.name)}!` }],
  })
);

server.prompt(
  "translate",
  "Translate text into Chinese.",
  { message: z.string() },
  ({ message }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please translate the following text into Chinese:\n\n${message}`,
        },
      },
    ],
  })
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
