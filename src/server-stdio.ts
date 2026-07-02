import { z } from "zod";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import signale from "signale";

// =========================
// Configuration
// =========================
const CONFIG = {
  serverName: "demo-mcp-stdio",
  serverVersion: "1.0.0",
} as const;

// =========================
// Types & Interfaces
// =========================
type Operation = (a: number, b: number) => number;

interface MathToolConfig {
  name: string;
  description: string;
  operation: Operation;
  validate?: (a: number, b: number) => void;
}

// =========================
// Initialization
// =========================
const server = new McpServer({
  name: CONFIG.serverName,
  version: CONFIG.serverVersion,
});

// =========================
// Helpers
// =========================
const createTextResponse = (text: string) => ({
  content: [{ type: "text" as const, text }],
});

const registerMathTool = ({ name, description, operation, validate }: MathToolConfig) => {
  server.tool(
    name,
    description,
    { a: z.number(), b: z.number() },
    async ({ a, b }) => {
      signale.info(`Tool Called: ${name}(${a}, ${b})`);
      if (validate) {
        validate(a, b);
      }
      const result = operation(a, b);
      signale.success(`Tool Result: ${name} -> ${result}`);
      return createTextResponse(String(result));
    }
  );
};

// =========================
// Tools
// =========================
const mathTools: MathToolConfig[] = [
  { name: "add", description: "加法工具 - 计算两个数的和", operation: (a: number, b: number) => a + b },
  { name: "subtract", description: "减法工具 - 计算两个数的差", operation: (a: number, b: number) => a - b },
  { name: "multiply", description: "乘法工具 - 计算两个数的乘积", operation: (a: number, b: number) => a * b },
  {
    name: "divide",
    description: "除法工具 - 计算两个数的商",
    operation: (a: number, b: number) => a / b,
    validate: (_a: number, b: number) => {
      if (b === 0) throw new Error("Division by zero is not allowed");
    },
  },
];

mathTools.forEach(registerMathTool);

// =========================
// Resources
// =========================
server.resource(
  "testing",
  "testing://testing",
  async (uri) => ({
    contents: [{ uri: uri.href, text: "Testing Succeed!" }],
  })
);

server.resource(
  "greeting",
  new ResourceTemplate("greeting://greeting/{name}", { list: undefined }),
  async (uri, match: any) => ({
    contents: [{ uri: uri.href, text: `Hello, ${match.name}!` }],
  })
);

// =========================
// Prompts
// =========================
server.prompt(
  "translate",
  "翻译Prompt",
  { message: z.string() },
  ({ message }) => ({
    messages: [{
      role: "user",
      content: { type: "text", text: `请将下面的话翻译成中文：\n\n${message}` },
    }],
  })
);

// =========================
// Start Server (Stdio)
// =========================
async function main() {
  const transport = new StdioServerTransport();
  signale.success(`MCP Stdio Server: ${CONFIG.serverName} v${CONFIG.serverVersion}`);
  await server.connect(transport);
}

main().catch((err) => {
  signale.fatal(err);
  process.exit(1);
});
