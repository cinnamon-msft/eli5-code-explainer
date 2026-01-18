import { defineTool } from "@github/copilot-sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { z } from "zod";

/**
 * Convert all tools from an MCP client to Copilot SDK tools
 */
export async function mcpToolsToCopilot(mcpClient: Client, prefix: string) {
    const { tools } = await mcpClient.listTools();
    
    return tools.map(tool => {
        // Build Zod schema from JSON Schema (simplified)
        const inputSchema = tool.inputSchema as Record<string, any> || { type: "object", properties: {} };
        
        return defineTool(`${prefix}_${tool.name}`, {
            description: `[${prefix}] ${tool.description || tool.name}`,
            parameters: inputSchema,
            handler: async (params: Record<string, any>) => {
                try {
                    const result = await mcpClient.callTool({
                        name: tool.name,
                        arguments: params
                    });
                    
                    // Extract text content from result
                    const content = result.content
                        .map((c: any) => {
                            if (typeof c === "string") return c;
                            if (c.text) return c.text;
                            return JSON.stringify(c);
                        })
                        .join("\n");
                    
                    return content;
                } catch (error) {
                    return `Error calling ${tool.name}: ${error}`;
                }
            }
        });
    });
}

/**
 * Create custom tools for code explanation
 */
export function createExplainerTools() {
    return [
        defineTool("format_explanation", {
            description: "Format an explanation with proper markdown and emojis",
            parameters: z.object({
                title: z.string().describe("Title of the explanation"),
                content: z.string().describe("The explanation content"),
                codeSnippet: z.string().optional().describe("Optional code snippet to include")
            }),
            handler: async ({ title, content, codeSnippet }) => {
                let formatted = `## ${title}\n\n${content}`;
                if (codeSnippet) {
                    formatted += `\n\n\`\`\`\n${codeSnippet}\n\`\`\``;
                }
                return formatted;
            }
        }),

        defineTool("get_complexity_rating", {
            description: "Rate the complexity of a code snippet",
            parameters: z.object({
                linesOfCode: z.number(),
                nestedDepth: z.number(),
                numFunctions: z.number()
            }),
            handler: async ({ linesOfCode, nestedDepth, numFunctions }) => {
                let score = 0;
                score += linesOfCode > 100 ? 3 : linesOfCode > 50 ? 2 : 1;
                score += nestedDepth > 4 ? 3 : nestedDepth > 2 ? 2 : 1;
                score += numFunctions > 10 ? 3 : numFunctions > 5 ? 2 : 1;
                
                const avgScore = score / 3;
                const rating = avgScore > 2.5 ? "🔴 Complex" : avgScore > 1.5 ? "🟡 Moderate" : "🟢 Simple";
                
                return rating;
            }
        })
    ];
}
