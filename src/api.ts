/**
 * Programmatic API for using ELI5 agents in other applications
 */
import { AgentManager } from "./manager.js";
import { PersonaKey } from "./personas.js";
import { AgentResponse } from "./types.js";
import { connectFilesystemMcp, connectGitMcp, McpConnection, disconnectMcpServer } from "./mcp/client.js";

export class ELI5Explainer {
    private agentManager: AgentManager;
    private mcpConnections: McpConnection[] = [];
    private initialized = false;

    constructor() {
        this.agentManager = new AgentManager();
    }

    /**
     * Initialize the explainer with a working directory
     */
    async init(workingDir: string = process.cwd()): Promise<void> {
        if (this.initialized) return;

        // Connect MCP servers
        try {
            const fsMcp = await connectFilesystemMcp(workingDir);
            this.mcpConnections.push(fsMcp);
        } catch (e) {
            console.warn("Could not connect filesystem MCP");
        }

        try {
            const gitMcp = await connectGitMcp(workingDir);
            this.mcpConnections.push(gitMcp);
        } catch (e) {
            // Git MCP is optional
        }

        await this.agentManager.initialize(this.mcpConnections);
        this.initialized = true;
    }

    /**
     * Explain code with a specific agent
     */
    async explain(
        code: string,
        agent: PersonaKey = "eli5",
        question?: string
    ): Promise<AgentResponse> {
        if (!this.initialized) {
            throw new Error("ELI5Explainer not initialized. Call init() first.");
        }
        return this.agentManager.explain(agent, code, question);
    }

    /**
     * Explain code with all agents
     */
    async explainAll(code: string, question?: string): Promise<AgentResponse[]> {
        if (!this.initialized) {
            throw new Error("ELI5Explainer not initialized. Call init() first.");
        }
        return this.agentManager.explainWithAll(code, question);
    }

    /**
     * Explain a file
     */
    async explainFile(
        filePath: string,
        agent: PersonaKey = "eli5",
        question?: string
    ): Promise<AgentResponse | AgentResponse[]> {
        if (!this.initialized) {
            throw new Error("ELI5Explainer not initialized. Call init() first.");
        }
        return this.agentManager.explainFile(filePath, agent, question);
    }

    /**
     * Get ELI5 explanation (shorthand)
     */
    async eli5(code: string, question?: string): Promise<string> {
        const response = await this.explain(code, "eli5", question);
        return response.explanation;
    }

    /**
     * Get technical explanation (shorthand)
     */
    async technical(code: string, question?: string): Promise<string> {
        const response = await this.explain(code, "tech", question);
        return response.explanation;
    }

    /**
     * Get analogy explanation (shorthand)
     */
    async analogy(code: string, question?: string): Promise<string> {
        const response = await this.explain(code, "analogy", question);
        return response.explanation;
    }

    /**
     * Get roast explanation (shorthand)
     */
    async roast(code: string, question?: string): Promise<string> {
        const response = await this.explain(code, "roast", question);
        return response.explanation;
    }

    /**
     * Cleanup resources
     */
    async close(): Promise<void> {
        await this.agentManager.shutdown();
        for (const conn of this.mcpConnections) {
            await disconnectMcpServer(conn);
        }
        this.initialized = false;
    }
}

// Export types and classes
export { AgentResponse, PersonaKey };
export { AGENT_PERSONAS } from "./personas.js";
