"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const signale_1 = __importDefault(require("signale"));
// =========================
// Configuration
// =========================
const CONFIG = {
    serverName: "demo-mcp-stdio",
    serverVersion: "1.0.0",
};
// =========================
// Initialization
// =========================
const server = new mcp_js_1.McpServer({
    name: CONFIG.serverName,
    version: CONFIG.serverVersion,
});
// =========================
// Helpers
// =========================
const createTextResponse = (text) => ({
    content: [{ type: "text", text }],
});
const registerMathTool = ({ name, description, operation, validate }) => {
    server.tool(name, description, { a: zod_1.z.number(), b: zod_1.z.number() }, async ({ a, b }) => {
        signale_1.default.info(`Tool Called: ${name}(${a}, ${b})`);
        if (validate) {
            validate(a, b);
        }
        const result = operation(a, b);
        signale_1.default.success(`Tool Result: ${name} -> ${result}`);
        return createTextResponse(String(result));
    });
};
// =========================
// Tools
// =========================
const mathTools = [
    { name: "add", description: "加法工具 - 计算两个数的和", operation: (a, b) => a + b },
    { name: "subtract", description: "减法工具 - 计算两个数的差", operation: (a, b) => a - b },
    { name: "multiply", description: "乘法工具 - 计算两个数的乘积", operation: (a, b) => a * b },
    {
        name: "divide",
        description: "除法工具 - 计算两个数的商",
        operation: (a, b) => a / b,
        validate: (_a, b) => {
            if (b === 0)
                throw new Error("Division by zero is not allowed");
        },
    },
];
mathTools.forEach(registerMathTool);
// =========================
// Resources
// =========================
server.resource("testing", "testing://testing", async (uri) => ({
    contents: [{ uri: uri.href, text: "Testing Succeed!" }],
}));
server.resource("greeting", new mcp_js_1.ResourceTemplate("greeting://greeting/{name}", { list: undefined }), async (uri, match) => ({
    contents: [{ uri: uri.href, text: `Hello, ${match.name}!` }],
}));
// =========================
// Prompts
// =========================
server.prompt("translate", "翻译Prompt", { message: zod_1.z.string() }, ({ message }) => ({
    messages: [{
            role: "user",
            content: { type: "text", text: `请将下面的话翻译成中文：\n\n${message}` },
        }],
}));
// =========================
// Start Server (Stdio)
// =========================
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    signale_1.default.success(`MCP Stdio Server: ${CONFIG.serverName} v${CONFIG.serverVersion}`);
    await server.connect(transport);
}
main().catch((err) => {
    signale_1.default.fatal(err);
    process.exit(1);
});
