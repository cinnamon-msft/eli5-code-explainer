import chalk from "chalk";
import ora from "ora";
import { AgentResponse } from "../types.js";

// Agent personality colors
const AGENT_COLORS: Record<string, (text: string) => string> = {
    "eli5": chalk.hex("#FFB347"),      // Warm orange
    "tech-expert": chalk.hex("#87CEEB"), // Sky blue
    "analogy-master": chalk.hex("#DDA0DD"), // Plum
    "code-roaster": chalk.hex("#FF6B6B"),  // Coral red
};

// Agent greeting messages
const AGENT_GREETINGS: Record<string, string[]> = {
    "eli5": [
        "Hey there, friend! Let me explain this like we're playing with blocks! 🧱",
        "Ooh, fun code! Let me tell you a story about it! 📖",
        "Hi hi! Ready to learn something cool? 🌟"
    ],
    "tech-expert": [
        "Analyzing the implementation details...",
        "Let me examine the architectural patterns here.",
        "Running technical analysis on this codebase."
    ],
    "analogy-master": [
        "Hmm, this reminds me of something... 🤔",
        "Let me paint you a picture of what's happening here!",
        "I've got the perfect real-world comparison for this!"
    ],
    "code-roaster": [
        "Oh boy, let's see what we're working with here... 👀",
        "*cracks knuckles* Alright, let's do this!",
        "Time for some tough love! Don't worry, it's for your own good. 😏"
    ]
};

/**
 * Get a random greeting for an agent
 */
function getGreeting(agentKey: string): string {
    const greetings = AGENT_GREETINGS[agentKey] || ["Processing..."];
    return greetings[Math.floor(Math.random() * greetings.length)];
}

/**
 * Get the color function for an agent
 */
function getAgentColor(agentName: string): (text: string) => string {
    return AGENT_COLORS[agentName] || chalk.white;
}

/**
 * Display agent "typing" with spinner
 */
export function createAgentSpinner(agentName: string, emoji: string): ReturnType<typeof ora> {
    const color = getAgentColor(agentName);
    return ora({
        text: color(`${emoji} ${agentName} is typing...`),
        spinner: "dots",
        color: "cyan"
    });
}

/**
 * Display a single agent response with chat-like formatting
 */
export function displayResponse(response: AgentResponse): void {
    const agentKey = response.agent.toLowerCase().replace(/\s+/g, "-");
    const color = getAgentColor(agentKey);
    
    console.log("\n");
    
    // Agent header with chat bubble style
    console.log(color("┌" + "─".repeat(58) + "┐"));
    console.log(color(`│ ${response.emoji} ${response.agent}`.padEnd(59) + "│"));
    console.log(color("└" + "─".repeat(58) + "┘"));
    
    // Response content with slight indent to look like a message
    const lines = response.explanation.split("\n");
    for (const line of lines) {
        console.log(chalk.white("  " + line));
    }
    
    console.log("");
}

/**
 * Display multiple agent responses as a group chat
 */
export function displayAllResponses(responses: AgentResponse[]): void {
    console.log("\n");
    console.log(chalk.bold.magenta("╔" + "═".repeat(58) + "╗"));
    console.log(chalk.bold.magenta("║" + "  🎭 AGENT ROUNDTABLE".padEnd(58) + "║"));
    console.log(chalk.bold.magenta("║" + "  Multiple perspectives on your code".padEnd(58) + "║"));
    console.log(chalk.bold.magenta("╚" + "═".repeat(58) + "╝"));

    for (const response of responses) {
        displayResponse(response);
    }
    
    console.log(chalk.gray("\n─".repeat(60)));
    console.log(chalk.gray("  💬 All agents have shared their perspectives!"));
    console.log(chalk.gray("─".repeat(60)));
}

/**
 * Display welcome banner
 */
export function displayWelcome(): void {
    console.log(chalk.cyan(`
    ╭──────────────────────────────────────────────────────────╮
    │                                                          │
    │   ${chalk.bold("🤖 CODE EXPLAINER AGENTS")}                              │
    │   ${chalk.gray("Your AI team for understanding code")}                   │
    │                                                          │
    ╰──────────────────────────────────────────────────────────╯
    `));
    
    console.log(chalk.white("    Meet your agents:\n"));
    console.log(chalk.hex("#FFB347")("    🧒 ELI5          ") + chalk.gray("Explains like you're 5"));
    console.log(chalk.hex("#87CEEB")("    🔬 Tech Expert   ") + chalk.gray("Deep technical analysis"));
    console.log(chalk.hex("#DDA0DD")("    🌉 Analogy Master") + chalk.gray("Real-world comparisons"));
    console.log(chalk.hex("#FF6B6B")("    🔥 Code Roaster  ") + chalk.gray("Constructive criticism with humor"));
    console.log("");
}

/**
 * Display agent selection as a conversation
 */
export function displayAgentMenu(): void {
    console.log(chalk.cyan("\n┌─────────────────────────────────────────────────────────┐"));
    console.log(chalk.cyan("│") + chalk.white(" Who would you like to talk to?                          ") + chalk.cyan("│"));
    console.log(chalk.cyan("└─────────────────────────────────────────────────────────┘\n"));
    
    console.log(chalk.hex("#FFB347")("  [1] 🧒 ELI5         ") + chalk.gray('"I\'ll make it super simple!"'));
    console.log(chalk.hex("#87CEEB")("  [2] 🔬 Tech Expert  ") + chalk.gray('"Let\'s dive into the details."'));
    console.log(chalk.hex("#DDA0DD")("  [3] 🌉 Analogy      ") + chalk.gray('"I\'ve got the perfect comparison!"'));
    console.log(chalk.hex("#FF6B6B")("  [4] 🔥 Roaster      ") + chalk.gray('"Time for some tough love!"'));
    console.log(chalk.magenta("  [5] 🎭 Everyone     ") + chalk.gray('"Let\'s hear from all of us!"'));
    console.log(chalk.gray("\n  [q] Exit"));
}

/**
 * Show agent greeting when selected
 */
export function showAgentGreeting(agentKey: string, emoji: string, name: string): void {
    const color = getAgentColor(agentKey);
    const greeting = getGreeting(agentKey);
    
    console.log("\n" + color("━".repeat(60)));
    console.log(color(`${emoji} ${name}: `) + chalk.white(`"${greeting}"`));
    console.log(color("━".repeat(60)) + "\n");
}

/**
 * Display a loading spinner message
 */
export function showThinking(agentName: string, emoji: string): void {
    console.log(chalk.gray(`\n${emoji} ${agentName} is thinking...`));
}

/**
 * Display error message
 */
export function showError(message: string): void {
    console.log(chalk.red(`\n❌ Error: ${message}`));
}

/**
 * Display success message
 */
export function showSuccess(message: string): void {
    console.log(chalk.green(`\n✅ ${message}`));
}

/**
 * Display a conversational prompt
 */
export function showConversationPrompt(agentEmoji: string): void {
    console.log(chalk.gray(`\n💬 What would you like ${agentEmoji} to explain?\n`));
}

/**
 * Display goodbye message from agents
 */
export function showGoodbye(): void {
    console.log(chalk.cyan(`
    ╭──────────────────────────────────────────────────────────╮
    │                                                          │
    │   ${chalk.bold("👋 Thanks for chatting with us!")}                        │
    │                                                          │
    │   🧒 "Bye bye, friend!"                                  │
    │   🔬 "Until next time."                                  │
    │   🌉 "Like saying goodbye to old friends!"               │
    │   🔥 "Your code will miss my roasts!"                    │
    │                                                          │
    ╰──────────────────────────────────────────────────────────╯
    `));
}
