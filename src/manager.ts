import { CopilotClient, CopilotSession } from "@github/copilot-sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { AGENT_PERSONAS, PersonaKey } from "./personas.js";
import { Agent, AgentResponse, AgentType } from "./types.js";
import { mcpToolsToCopilot, createExplainerTools } from "./mcp/tools.js";
import { McpConnection } from "./mcp/client.js";
import { resolve } from "path";

export class AgentManager {
    private copilotClient: CopilotClient;
    private agents: Map<PersonaKey, Agent> = new Map();
    private mcpConnections: McpConnection[] = [];
    private allTools: any[] = [];
    private initialized = false;

    constructor() {
        // Resolve to absolute path - this bypasses the SDK's cmd /c wrapper on Windows
        const cliPath = resolve(process.cwd(), "node_modules/@github/copilot/npm-loader.js");
        
        this.copilotClient = new CopilotClient({ cliPath });
    }

    /**
     * Initialize the agent manager with MCP connections
     */
    async initialize(mcpConnections: McpConnection[]): Promise<void> {
        if (this.initialized) return;

        console.log("\n🚀 Initializing Agent Manager...\n");
        
        this.mcpConnections = mcpConnections;

        // Start Copilot client
        await this.copilotClient.start();
        console.log("✅ Copilot SDK connected\n");

        // Collect all MCP tools
        for (const conn of mcpConnections) {
            const tools = await mcpToolsToCopilot(conn.client, conn.name);
            this.allTools.push(...tools);
        }

        // Add custom explainer tools
        this.allTools.push(...createExplainerTools());

        // Create all agents
        for (const [key, persona] of Object.entries(AGENT_PERSONAS)) {
            const session = await this.createAgentSession(key as PersonaKey);
            this.agents.set(key as PersonaKey, {
                name: persona.name,
                emoji: persona.emoji,
                description: persona.description,
                session
            });
            console.log(`${persona.emoji} Created agent: ${persona.name}`);
        }

        this.initialized = true;
        console.log("\n✅ All agents ready!\n");
    }

    /**
     * Create a session for a specific agent persona
     */
    private async createAgentSession(personaKey: PersonaKey): Promise<CopilotSession> {
        const persona = AGENT_PERSONAS[personaKey];
        
        return await this.copilotClient.createSession({
            model: "gpt-5",
            streaming: true,
            systemMessage: {
                content: persona.systemPrompt
            },
            tools: this.allTools
        });
    }

    /**
     * Get an explanation from a specific agent
     */
    async explain(
        agentType: PersonaKey,
        code: string,
        question?: string
    ): Promise<AgentResponse> {
        const agent = this.agents.get(agentType);
        if (!agent) {
            throw new Error(`Unknown agent type: ${agentType}`);
        }

        const prompt = question
            ? `Explain this code, focusing on: ${question}\n\n\`\`\`\n${code}\n\`\`\``
            : `Explain this code:\n\n\`\`\`\n${code}\n\`\`\``;

        const response = await agent.session.sendAndWait({ prompt });

        return {
            agent: agent.name,
            emoji: agent.emoji,
            explanation: response?.data?.content || "No explanation generated"
        };
    }

    /**
     * Get explanations from all agents
     */
    async explainWithAll(code: string, question?: string): Promise<AgentResponse[]> {
        const results: AgentResponse[] = [];

        for (const [key, agent] of this.agents) {
            console.log(`\n${agent.emoji} ${agent.name} is thinking...`);
            const response = await this.explain(key, code, question);
            results.push(response);
        }

        return results;
    }

    /**
     * Read a file and explain it
     */
    async explainFile(
        filePath: string,
        agentType: AgentType,
        question?: string
    ): Promise<AgentResponse | AgentResponse[]> {
        // Find filesystem MCP connection
        const fsMcp = this.mcpConnections.find(c => c.name === "filesystem");
        if (!fsMcp) {
            throw new Error("Filesystem MCP not connected");
        }

        // Read the file using MCP
        const result = await fsMcp.client.callTool({
            name: "read_file",
            arguments: { path: filePath }
        });

        const code = result.content
            .map((c: any) => c.text || JSON.stringify(c))
            .join("\n");

        if (agentType === "all") {
            return this.explainWithAll(code, question);
        }

        return this.explain(agentType as PersonaKey, code, question);
    }

    /**
     * Get a specific agent
     */
    getAgent(type: PersonaKey): Agent | undefined {
        return this.agents.get(type);
    }

    /**
     * List all available agents
     */
    listAgents(): { key: PersonaKey; name: string; emoji: string; description: string }[] {
        return Object.entries(AGENT_PERSONAS).map(([key, persona]) => ({
            key: key as PersonaKey,
            name: persona.name,
            emoji: persona.emoji,
            description: persona.description
        }));
    }

    /**
     * Shutdown all agents and connections
     */
    async shutdown(): Promise<void> {
        console.log("\n👋 Shutting down agents...");
        
        for (const [_, agent] of this.agents) {
            await agent.session.destroy();
        }

        await this.copilotClient.stop();
        
        console.log("✅ All agents shut down");
    }
}
