/**
 * Demo script showing all agents explaining the same code
 */
import { AgentManager } from "./manager.js";
import { connectFilesystemMcp, disconnectMcpServer, McpConnection } from "./mcp/client.js";
import { displayWelcome, displayAllResponses, displayResponse } from "./ui/display.js";
import chalk from "chalk";

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

    console.log(chalk.cyan("🎬 Running Demo: All Agents Explain Authentication Code\n"));
    console.log(chalk.gray("Sample code:"));
    console.log(chalk.gray("─".repeat(60)));
    console.log(SAMPLE_CODE);
    console.log(chalk.gray("─".repeat(60)));

    // Connect MCP (filesystem only for demo)
    const mcpConnections: McpConnection[] = [];
    
    try {
        const fsMcp = await connectFilesystemMcp(process.cwd());
        mcpConnections.push(fsMcp);
    } catch (error) {
        console.log(chalk.yellow("⚠️  Running without filesystem MCP"));
    }

    // Initialize agents
    const agentManager = new AgentManager();
    await agentManager.initialize(mcpConnections);

    console.log(chalk.cyan("\n🎯 Getting explanations from all agents...\n"));

    // Get explanations from all agents
    const responses = await agentManager.explainWithAll(
        SAMPLE_CODE,
        "How does the authentication flow work?"
    );

    // Display all responses
    displayAllResponses(responses);

    // Show comparison summary
    console.log(chalk.bold.cyan("\n═══════════════════════════════════════════════════════════"));
    console.log(chalk.bold.cyan("  📊 COMPARISON SUMMARY"));
    console.log(chalk.bold.cyan("═══════════════════════════════════════════════════════════\n"));

    console.log(chalk.white(`
┌────────────────┬───────────────────────────────────────────────────┐
│ Agent          │ Best For                                          │
├────────────────┼───────────────────────────────────────────────────┤
│ 🧒 ELI5        │ Beginners, non-technical stakeholders             │
│ 🔬 Tech        │ Code reviews, documentation, onboarding devs      │
│ 🌉 Analogy     │ Teaching, presentations, memorable explanations   │
│ 🔥 Roast       │ Code reviews with humor, identifying issues       │
└────────────────┴───────────────────────────────────────────────────┘
    `));

    // Cleanup
    await agentManager.shutdown();
    for (const conn of mcpConnections) {
        await disconnectMcpServer(conn);
    }

    console.log(chalk.cyan("\n✨ Demo complete!\n"));
}

runDemo().catch(console.error);
