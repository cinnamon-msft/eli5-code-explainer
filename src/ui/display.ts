import chalk from "chalk";
import { AgentResponse } from "../types.js";

/**
 * Display a single agent response with nice formatting
 */
export function displayResponse(response: AgentResponse): void {
    const divider = chalk.gray("─".repeat(60));
    
    console.log("\n" + divider);
    console.log(chalk.bold(`${response.emoji} ${response.agent}`));
    console.log(divider + "\n");
    console.log(response.explanation);
    console.log("\n" + divider);
}

/**
 * Display multiple agent responses
 */
export function displayAllResponses(responses: AgentResponse[]): void {
    console.log("\n" + chalk.bold.cyan("═".repeat(60)));
    console.log(chalk.bold.cyan("  🎭 MULTIPLE PERSPECTIVES"));
    console.log(chalk.bold.cyan("═".repeat(60)));

    for (const response of responses) {
        displayResponse(response);
    }
}

/**
 * Display welcome banner
 */
export function displayWelcome(): void {
    console.log(chalk.cyan(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🧒 ELI5 CODE EXPLAINER                                  ║
║   Multiple AI Agents to Explain Your Code                 ║
║                                                           ║
║   Agents:                                                 ║
║   🧒 ELI5      - Like you're 5 years old                 ║
║   🔬 Tech      - Deep technical analysis                  ║
║   🌉 Analogy   - Real-world comparisons                   ║
║   🔥 Roast     - Constructive criticism with humor       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `));
}

/**
 * Display agent selection menu
 */
export function displayAgentMenu(): void {
    console.log(chalk.yellow("\nChoose an agent:"));
    console.log("  1) 🧒 ELI5      - Explains like you're 5");
    console.log("  2) 🔬 Tech      - Technical deep-dive");
    console.log("  3) 🌉 Analogy   - Real-world analogies");
    console.log("  4) 🔥 Roast     - Constructive roast");
    console.log("  5) 🎭 All       - Get all perspectives");
    console.log("  q) Quit");
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
