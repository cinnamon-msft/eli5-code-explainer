import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export interface McpConnection {
    client: Client;
    name: string;
}

/**
 * Connect to an MCP server via stdio transport
 */
export async function connectMcpServer(
    name: string,
    command: string,
    args: string[],
    env: Record<string, string> = {}
): Promise<McpConnection> {
    const client = new Client({ name, version: "1.0.0" });
    
    const transport = new StdioClientTransport({
        command,
        args,
        env: { ...process.env, ...env } as Record<string, string>
    });

    await client.connect(transport);
    
    console.log(`✅ Connected to MCP server: ${name}`);
    
    // List available tools for debugging
    const { tools } = await client.listTools();
    console.log(`   📦 Tools: ${tools.map(t => t.name).join(", ")}`);
    
    return { client, name };
}

/**
 * Disconnect from an MCP server
 */
export async function disconnectMcpServer(connection: McpConnection): Promise<void> {
    await connection.client.close();
    console.log(`🔌 Disconnected from: ${connection.name}`);
}

/**
 * Connect to the filesystem MCP server
 */
export async function connectFilesystemMcp(rootPath: string): Promise<McpConnection> {
    return connectMcpServer(
        "filesystem",
        "npx",
        ["-y", "@modelcontextprotocol/server-filesystem", rootPath]
    );
}

/**
 * Connect to the git MCP server
 * Note: Uses the official MCP git server package
 */
export async function connectGitMcp(repoPath: string): Promise<McpConnection> {
    return connectMcpServer(
        "git",
        "npx",
        ["-y", "@modelcontextprotocol/server-git", "--repository", repoPath]
    );
}
