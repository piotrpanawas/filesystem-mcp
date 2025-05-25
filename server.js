import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from "fs/promises";
import path from "path";

const args = process.argv.slice(2);
if (args.length === 0) {
    console.error("List of permitted directories needs to be specified before allowing MCP to access your filesystem");
    process.exit(1);
}

function normalizePath(p) {
    return path.normalize(p);
}

const allowedDirectories = args.map(dir =>
    normalizePath(path.resolve(dir))
);

function isPathPermitted(dirPath) {
    const absolute = path.isAbsolute(dirPath)
    ? path.resolve(dirPath)
    : path.resolve(process.cwd(), dirPath);
    
    const pathToCheck = normalizePath(path.resolve(absolute));

    return allowedDirectories.some(allowed => pathToCheck.startsWith(allowed + "\\"));
}

const server = new McpServer({
    name: 'filesystem',
    version: '0.0.1',
});


server.tool(
    'greet',
    { name: z.string().describe('Recipient name') },
    async ({ name }) => {
        return {
            content: [{
                type: 'text',
                text: `Hello, ${name}! Current server time: ${new Date().toISOString()}`
            }]
        }
    }
);

server.tool(
    'browse-files',
    'Browse/list the files in the specified directory. Specified directory needs to be part of the permitted directories tree',
    {
        dirPath: z.string().describe('The directory to browse')
    },
    async ({ dirPath }) => {
        if (!isPathPermitted(dirPath)) {
            return {
                content: [{ type: "text", text: `Error: Directory not permitted. You need to specify permitted directories when setting up MCP. Permitted directories are: ${allowedDirectories} and ${dirPath} is not included in allowed directories.` }],
            };
        }
        const files = await getAllFiles(dirPath);
        return {
            content: [{ type: "text", text: files.length > 0 ? files.join("\n") : "Given directory is empty" }],
        };
    }
);

server.tool(
    'read-file',
    'Read the file at the specified path. This path must be part of the permitted directories tree',
    {
        filePath: z.string().describe('Path to the file that needs to be read')
    },
    async ({ filePath }) => {
        if (!isPathPermitted(filePath)) {
            return {
                content: [{ type: 'text', text: 'Error: File path not permitted.' }]
            };
        }
        const res = await readFile(filePath);
        if (res.type === 'file') {
            return {
                content: [{
                    type: 'text',
                    text: res.content
                }]
            };
        } else {
            return {
                content: [{
                    type: 'text',
                    text: `Error: ${res.message}`
                }]
            };
        }
    }
)

async function getAllFiles(dirPath, filePaths = []) {
    const files = await fs.readdir(dirPath);
    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
            await getAllFiles(fullPath, filePaths);
        } else {
            filePaths.push(fullPath);
        }
    }
    return filePaths;
}

async function readFile(path) {
    try {
        const content = await fs.readFile(path, 'utf-8');
        return {
            type: 'file',
            content
        }
    } catch (err) {
        return {
            type: 'error',
            message: err.message,
        };
    }
}

async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

runServer().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
});