import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import chalk from "chalk";

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
    
    // List available tools (silent logging)
    const { tools } = await client.listTools();
    
    return { client, name };
}

/**
 * Disconnect from an MCP server
 */
export async function disconnectMcpServer(connection: McpConnection): Promise<void> {
    await connection.client.close();
}

/**
 * Connect to the filesystem MCP server
 * Provides: read_file, read_multiple_files, write_file, edit_file, 
 *           create_directory, list_directory, directory_tree, move_file,
 *           search_files, get_file_info, list_allowed_directories
 */
export async function connectFilesystemMcp(rootPath: string): Promise<McpConnection> {
    return connectMcpServer(
        "filesystem",
        "npx",
        ["-y", "@modelcontextprotocol/server-filesystem", rootPath]
    );
}

/**
 * Connect to the Git MCP server
 * Provides: git_status, git_diff, git_commit, git_log, git_branch_list, etc.
 * Requires: Python/uvx installed
 */
export async function connectGitMcp(repoPath: string): Promise<McpConnection> {
    return connectMcpServer(
        "git",
        "uvx",
        ["mcp-server-git", "--repository", repoPath]
    );
}

/**
 * Connect to the GitHub MCP server
 * Provides: search_repositories, get_file_contents, create_or_update_file, 
 *           push_files, create_issue, create_pull_request, list_commits, etc.
 * Requires: GITHUB_PERSONAL_ACCESS_TOKEN environment variable
 */
export async function connectGitHubMcp(): Promise<McpConnection> {
    const token = process.env.GITHUB_PERSONAL_ACCESS_TOKEN || process.env.GITHUB_TOKEN;
    if (!token) {
        throw new Error("GitHub token not found. Set GITHUB_PERSONAL_ACCESS_TOKEN or GITHUB_TOKEN environment variable.");
    }
    
    return connectMcpServer(
        "github",
        "npx",
        ["-y", "@modelcontextprotocol/server-github"],
        { GITHUB_PERSONAL_ACCESS_TOKEN: token }
    );
}

/**
 * Connect to all available MCP servers for the workspace
 */
export async function connectAllMcpServers(workingDir: string): Promise<{
    connections: McpConnection[];
    errors: { name: string; error: string }[];
}> {
    const connections: McpConnection[] = [];
    const errors: { name: string; error: string }[] = [];

    // Always try filesystem (most important for code explainer)
    try {
        const fs = await connectFilesystemMcp(workingDir);
        connections.push(fs);
    } catch (error) {
        errors.push({ name: "filesystem", error: `${error}` });
    }

    // Try Git if in a git repository
    try {
        const git = await connectGitMcp(workingDir);
        connections.push(git);
    } catch (error) {
        // Git is optional - don't fail if not available
        errors.push({ name: "git", error: `${error}` });
    }

    // Try GitHub if token is available
    if (process.env.GITHUB_PERSONAL_ACCESS_TOKEN || process.env.GITHUB_TOKEN) {
        try {
            const github = await connectGitHubMcp();
            connections.push(github);
        } catch (error) {
            errors.push({ name: "github", error: `${error}` });
        }
    }

    return { connections, errors };
}
