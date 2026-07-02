"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const sse_js_1 = require("@modelcontextprotocol/sdk/server/sse.js");
const signale_1 = __importDefault(require("signale"));
// =========================
// Configuration
// =========================
const CONFIG = {
    host: "0.0.0.0",
    port: 8080,
    serverName: "demo-mcp-sse",
    serverVersion: "1.0.0",
    ssePath: "/sse",
    messagesPath: "/messages",
};
// =========================
// Initialization
// =========================
const app = (0, express_1.default)();
const server = new mcp_js_1.McpServer({
    name: CONFIG.serverName,
    version: CONFIG.serverVersion,
});
// app.use(express.json());
// =========================
// Helpers
// =========================
/**
 * 创建统一格式的文本响应
 */
const createTextResponse = (text) => ({
    content: [{ type: "text", text }],
});
/**
 * 注册数学运算工具（消除重复代码）
 */
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
// 数学运算工具配置
const mathTools = [
    {
        name: "add",
        description: "加法工具 - 计算两个数的和",
        operation: (a, b) => a + b,
    },
    {
        name: "subtract",
        description: "减法工具 - 计算两个数的差",
        operation: (a, b) => a - b,
    },
    {
        name: "multiply",
        description: "乘法工具 - 计算两个数的乘积",
        operation: (a, b) => a * b,
    },
    {
        name: "divide",
        description: "除法工具 - 计算两个数的商",
        operation: (a, b) => a / b,
        validate: (_a, b) => {
            if (b === 0) {
                throw new Error("Division by zero is not allowed");
            }
        },
    },
];
// 批量注册数学工具
mathTools.forEach(registerMathTool);
// =========================
// Resources
// =========================
server.resource("testing", "testing://testing", async (uri) => {
    return {
        contents: [
            {
                uri: uri.href,
                text: "Testing Succeed!",
            },
        ],
    };
});
/**
 * greeting://greeting/张三
 */
server.resource("greeting", new mcp_js_1.ResourceTemplate("greeting://greeting/{name}", {
    list: undefined
}), async (uri, match) => {
    const name = match.name;
    return {
        contents: [
            {
                uri: uri.href,
                text: `Hello, ${name}!`,
            },
        ],
    };
});
// =========================
// Prompts
// =========================
server.prompt("translate", "翻译Prompt", {
    message: zod_1.z.string(),
}, ({ message }) => {
    return {
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: `请将下面的话翻译成中文：\n\n${message}`,
                },
            },
        ],
    };
});
// =========================
// SSE Transport
// =========================
const transports = new Map();
/**
 * 建立 SSE 连接
 */
app.get(CONFIG.ssePath, async (_req, res) => {
    signale_1.default.info("New SSE connection");
    const transport = new sse_js_1.SSEServerTransport(CONFIG.messagesPath, res);
    transports.set(transport.sessionId, transport);
    transport.onclose = () => {
        signale_1.default.warn("Connection closed:", transport.sessionId);
        transports.delete(transport.sessionId);
    };
    await server.connect(transport);
});
/**
 * 接收 JSON-RPC 请求
 */
app.post(CONFIG.messagesPath, async (req, res) => {
    const sessionId = req.query.sessionId;
    if (!sessionId) {
        res.status(400).send("missing sessionId");
        return;
    }
    const transport = transports.get(sessionId);
    if (!transport) {
        res.status(404).send("unknown session");
        return;
    }
    await transport.handlePostMessage(req, res);
});
// =========================
// Start Server
// =========================
app.listen(CONFIG.port, CONFIG.host, () => {
    signale_1.default.success(`MCP SSE Server Running: http://${CONFIG.host}:${CONFIG.port}${CONFIG.ssePath}`);
});
