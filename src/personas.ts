// Agent persona definitions loaded from .github/agents/*.md files
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

/**
 * Parse a markdown file with YAML frontmatter into a Persona
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
    
    // Simple YAML parsing for our known fields
    const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
    const emojiMatch = frontmatter.match(/^emoji:\s*(.+)$/m);
    const descriptionMatch = frontmatter.match(/^description:\s*(.+)$/m);
    
    return {
        name: nameMatch?.[1]?.trim() || "Unknown",
        emoji: emojiMatch?.[1]?.trim() || "🤖",
        description: descriptionMatch?.[1]?.trim() || "",
        systemPrompt: body.trim()
    };
}

export const AGENT_PERSONAS = {
    eli5: parsePersonaFile("eli5.md"),
    tech: parsePersonaFile("tech.md"),
    analogy: parsePersonaFile("analogy.md"),
    roast: parsePersonaFile("roast.md")
};

export type PersonaKey = keyof typeof AGENT_PERSONAS;
