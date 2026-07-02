#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const server = new mcp_js_1.McpServer({
    name: "mcp-demo",
    version: "1.0.0",
});
const createTextResponse = (text) => ({
    content: [{ type: "text", text }],
});
const registerMathTool = ({ name, description, operation, validate }) => {
    server.tool(name, description, { a: zod_1.z.number(), b: zod_1.z.number() }, async ({ a, b }) => {
        if (validate) {
            validate(a, b);
        }
        return createTextResponse(String(operation(a, b)));
    });
};
const mathTools = [
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
server.resource("greeting", new mcp_js_1.ResourceTemplate("greeting://greeting/{name}", { list: undefined }), async (uri, variables) => ({
    contents: [{ uri: uri.href, text: `Hello, ${String(variables.name)}!` }],
}));
server.prompt("translate", "Translate text into Chinese.", { message: zod_1.z.string() }, ({ message }) => ({
    messages: [
        {
            role: "user",
            content: {
                type: "text",
                text: `Please translate the following text into Chinese:\n\n${message}`,
            },
        },
    ],
}));
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
