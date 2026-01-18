/**
 * Demo script showing all agents explaining the same code
 */
import { AgentManager } from "./manager.js";
import { connectFilesystemMcp, disconnectMcpServer, McpConnection } from "./mcp/client.js";
import { displayWelcome, displayAllResponses, showGoodbye } from "./ui/display.js";
import chalk from "chalk";
import ora from "ora";

// Sample code to explain
const SAMPLE_CODE = `
async function authenticateUser(email: string, password: string): Promise<User | null> {
    // Rate limiting check
    const attempts = await redis.get(\`login:\${email}\`);
    if (attempts && parseInt(attempts) > 5) {
        throw new Error("Too many login attempts. Please try again later.");
    }

    // Find user
    const user = await db.users.findOne({ email: email.toLowerCase() });
    if (!user) {
        await incrementLoginAttempts(email);
        return null;
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
        await incrementLoginAttempts(email);
        return null;
    }

    // Success! Reset attempts and generate token
    await redis.del(\`login:\${email}\`);
    
    const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
    );

    return { ...user, token };
}
`;

async function runDemo() {
    displayWelcome();

    console.log(chalk.magenta(`
    ╭──────────────────────────────────────────────────────────╮
    │                                                          │
    │   ${chalk.bold("🎬 DEMO: Agent Roundtable")}                              │
    │   ${chalk.gray("Watch all agents explain the same code!")}                │
    │                                                          │
    ╰──────────────────────────────────────────────────────────╯
    `));

    console.log(chalk.gray("    📋 Sample code: User Authentication Function\n"));
    console.log(chalk.gray("    ─".repeat(30)));
    
    // Display code with syntax highlighting effect
    const codeLines = SAMPLE_CODE.trim().split("\n");
    for (const line of codeLines) {
        console.log(chalk.gray("    │ ") + chalk.white(line));
    }
    console.log(chalk.gray("    ─".repeat(30)));

    // Connect MCP (filesystem only for demo)
    const mcpConnections: McpConnection[] = [];
    
    const connectSpinner = ora({
        text: chalk.gray("Setting up the stage..."),
        spinner: "dots"
    }).start();
    
    try {
        const fsMcp = await connectFilesystemMcp(process.cwd());
        mcpConnections.push(fsMcp);
        connectSpinner.succeed(chalk.gray("Stage is set!"));
    } catch (error) {
        connectSpinner.warn(chalk.yellow("Running without filesystem access"));
    }

    // Initialize agents
    const initSpinner = ora({
        text: chalk.gray("Inviting the agents to the roundtable..."),
        spinner: "dots"
    }).start();
    
    const agentManager = new AgentManager();
    await agentManager.initialize(mcpConnections);
    initSpinner.succeed(chalk.gray("All agents have arrived!"));

    console.log(chalk.magenta("\n    🎤 Question: \"How does the authentication flow work?\"\n"));

    // Show each agent "thinking"
    const thinkingSpinner = ora({
        text: chalk.magenta("🎭 Agents are preparing their explanations..."),
        spinner: "dots"
    }).start();

    // Get explanations from all agents
    const responses = await agentManager.explainWithAll(
        SAMPLE_CODE,
        "How does the authentication flow work?"
    );

    thinkingSpinner.stop();

    // Display all responses
    displayAllResponses(responses);

    // Show comparison summary
    console.log(chalk.magenta(`
    ╭──────────────────────────────────────────────────────────╮
    │                                                          │
    │   ${chalk.bold("📊 WHEN TO USE EACH AGENT")}                              │
    │                                                          │
    │   🧒 ${chalk.hex("#FFB347")("ELI5")}          Beginners, stakeholders, learning   │
    │   🔬 ${chalk.hex("#87CEEB")("Tech Expert")}   Code reviews, documentation         │
    │   🌉 ${chalk.hex("#DDA0DD")("Analogy")}       Teaching, presentations, memory     │
    │   🔥 ${chalk.hex("#FF6B6B")("Roaster")}       Fun reviews, finding issues         │
    │                                                          │
    ╰──────────────────────────────────────────────────────────╯
    `));

    // Cleanup
    const shutdownSpinner = ora({
        text: chalk.gray("Wrapping up the roundtable..."),
        spinner: "dots"
    }).start();
    
    await agentManager.shutdown();
    for (const conn of mcpConnections) {
        await disconnectMcpServer(conn);
    }
    
    shutdownSpinner.stop();
    
    console.log(chalk.cyan("\n    ✨ Demo complete! Run ") + chalk.bold("npm run dev") + chalk.cyan(" to chat with the agents.\n"));
}

runDemo().catch(console.error);
