import { CopilotSession } from "@github/copilot-sdk";

export interface Agent {
    name: string;
    emoji: string;
    description: string;
    session: CopilotSession;
}

export interface AgentResponse {
    agent: string;
    emoji: string;
    explanation: string;
}

export type AgentType = "eli5" | "tech" | "analogy" | "roast" | "all";

export interface ExplainRequest {
    target: string;  // File path or code snippet
    question?: string;  // Optional specific question
    agentType: AgentType;
}
