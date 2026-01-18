// Agent persona definitions loaded from .github/agents/*.agent.md files
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface Persona {
    name: string;
    emoji: string;
    description: string;
    systemPrompt: string;
}

// Emoji mapping for display purposes (not part of Copilot agent format)
const AGENT_EMOJIS: Record<string, string> = {
    "eli5": "🧒",
    "tech-expert": "🔬",
    "analogy-master": "🌉",
    "code-roaster": "🔥"
};

/**
 * Parse a Copilot custom agent .agent.md file into a Persona
 */
function parsePersonaFile(filename: string): Persona {
    // Navigate from src/ up to project root, then into .github/agents/
    const filePath = join(__dirname, "..", ".github", "agents", filename);
    const content = readFileSync(filePath, "utf-8");
    
    // Parse YAML frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) {
        throw new Error(`Invalid persona file format: ${filename}`);
    }
    
    const [, frontmatter, body] = frontmatterMatch;
    
    // Simple YAML parsing for Copilot agent fields
    const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
    const descriptionMatch = frontmatter.match(/^description:\s*(.+)$/m);
    
    const name = nameMatch?.[1]?.trim() || "Unknown";
    
    return {
        name,
        emoji: AGENT_EMOJIS[name] || "🤖",
        description: descriptionMatch?.[1]?.trim() || "",
        systemPrompt: body.trim()
    };
}

export const AGENT_PERSONAS = {
    eli5: parsePersonaFile("eli5.agent.md"),
    tech: parsePersonaFile("tech.agent.md"),
    analogy: parsePersonaFile("analogy.agent.md"),
    roast: parsePersonaFile("roast.agent.md")
};

export type PersonaKey = keyof typeof AGENT_PERSONAS;
