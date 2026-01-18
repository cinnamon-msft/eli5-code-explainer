import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";
import { AgentManager } from "./manager.js";
import { PersonaKey } from "./personas.js";
import { connectAllMcpServers, disconnectMcpServer, McpConnection } from "./mcp/client.js";
import { 
    displayWelcome, 
    displayResponse, 
    displayAllResponses, 
    displayAgentMenu, 
    showError,
    showAgentGreeting,
    showConversationPrompt,
    showGoodbye,
    createAgentSpinner
} from "./ui/display.js";

// Agent metadata for display
const AGENTS: Record<PersonaKey, { emoji: string; name: string; key: string }> = {
    eli5: { emoji: "🧒", name: "ELI5", key: "eli5" },
    tech: { emoji: "🔬", name: "Tech Expert", key: "tech-expert" },
    analogy: { emoji: "🌉", name: "Analogy Master", key: "analogy-master" },
    roast: { emoji: "🔥", name: "Code Roaster", key: "code-roaster" }
};

async function main() {
    displayWelcome();

    // Get the working directory
    const workingDir = process.argv[2] || process.cwd();
    console.log(chalk.gray(`    📂 Working in: ${workingDir}\n`));

    // Connect to MCP servers with spinner
    let mcpConnections: McpConnection[] = [];
    const connectSpinner = ora({
        text: chalk.gray("Connecting to MCP servers..."),
        spinner: "dots"
    }).start();

    try {
        const { connections, errors } = await connectAllMcpServers(workingDir);
        mcpConnections = connections;
        
        if (connections.length === 0) {
            connectSpinner.fail(chalk.red("Failed to connect to any MCP servers"));
            process.exit(1);
        }
        
        // Show connected servers
        const serverList = connections.map(c => c.name).join(", ");
        connectSpinner.succeed(chalk.gray(`Connected to MCP servers: ${chalk.cyan(serverList)}`));
        
        // Show optional server info
        if (errors.length > 0) {
            for (const err of errors) {
                if (err.name === "git") {
                    console.log(chalk.gray(`    ℹ️  Git server skipped (uvx not available or not in git repo)`));
                } else if (err.name === "github") {
                    console.log(chalk.gray(`    ℹ️  GitHub server skipped (no token set)`));
                }
            }
        }
    } catch (error) {
        connectSpinner.fail(chalk.red("Failed to connect to MCP servers"));
        showError(`${error}`);
        process.exit(1);
    }

    // Initialize agent manager with spinner
    const initSpinner = ora({
        text: chalk.gray("Waking up the agents..."),
        spinner: "dots"
    }).start();
    
    const agentManager = new AgentManager();
    await agentManager.initialize(mcpConnections);
    initSpinner.succeed(chalk.gray("All agents are ready to chat!"));

    // Main conversation loop
    let running = true;
    let currentAgent: PersonaKey | null = null;
    
    while (running) {
        displayAgentMenu();

        const { choice } = await inquirer.prompt([
            {
                type: "input",
                name: "choice",
                message: chalk.cyan("Your choice:"),
                prefix: "💭"
            }
        ]);

        if (choice.toLowerCase() === "q") {
            running = false;
            continue;
        }

        // Map choice to agent type
        const agentMap: Record<string, PersonaKey | "all"> = {
            "1": "eli5",
            "2": "tech",
            "3": "analogy",
            "4": "roast",
            "5": "all"
        };

        const agentType = agentMap[choice];
        if (!agentType) {
            showError("I didn't understand that. Please pick 1-5 or 'q' to quit.");
            continue;
        }

        // Show agent greeting (if not "all")
        if (agentType !== "all") {
            const agent = AGENTS[agentType];
            showAgentGreeting(agent.key, agent.emoji, agent.name);
            currentAgent = agentType;
        } else {
            console.log(chalk.magenta("\n🎭 All agents are ready to share their perspectives!\n"));
        }

        // Get what they want to discuss
        const { inputType } = await inquirer.prompt([
            {
                type: "list",
                name: "inputType",
                message: agentType === "all" 
                    ? "What should we discuss?" 
                    : "What can I help you understand?",
                prefix: agentType === "all" ? "🎭" : AGENTS[agentType].emoji,
                choices: [
                    { name: "📄 Read and explain a file", value: "file" },
                    { name: "📝 Explain code I'll paste", value: "code" },
                    { name: "❓ Answer a question about the codebase", value: "question" },
                    { name: "← Go back", value: "back" }
                ]
            }
        ]);

        if (inputType === "back") continue;

        if (inputType === "file") {
            const { filePath } = await inquirer.prompt([
                {
                    type: "input",
                    name: "filePath",
                    message: "Which file?",
                    prefix: "📄"
                }
            ]);

            const { fileQuestion } = await inquirer.prompt([
                {
                    type: "input",
                    name: "fileQuestion",
                    message: "Any specific aspect to focus on?",
                    prefix: "🎯",
                    default: ""
                }
            ]);

            try {
                if (agentType === "all") {
                    const spinner = ora({
                        text: chalk.magenta("🎭 Gathering perspectives from all agents..."),
                        spinner: "dots"
                    }).start();
                    
                    const responses = await agentManager.explainFile(filePath, agentType, fileQuestion || undefined);
                    spinner.stop();
                    
                    if (Array.isArray(responses)) {
                        displayAllResponses(responses);
                    }
                } else {
                    const agent = AGENTS[agentType];
                    const spinner = createAgentSpinner(agent.key, agent.emoji);
                    spinner.start();
                    
                    const response = await agentManager.explainFile(filePath, agentType, fileQuestion || undefined);
                    spinner.stop();
                    
                    if (!Array.isArray(response)) {
                        displayResponse(response);
                    }
                }
            } catch (error) {
                showError(`Couldn't read that file: ${error}`);
            }

        } else if (inputType === "code") {
            console.log(chalk.gray("\n  Paste your code below. Type 'END' on a new line when done:\n"));
            console.log(chalk.gray("  ─".repeat(30)));
            
            const lines: string[] = [];
            const readline = await import("readline");
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            await new Promise<void>((resolve) => {
                const readLine = () => {
                    rl.question(chalk.gray("  │ "), (line) => {
                        if (line.trim().toUpperCase() === "END") {
                            rl.close();
                            resolve();
                        } else {
                            lines.push(line);
                            readLine();
                        }
                    });
                };
                readLine();
            });

            console.log(chalk.gray("  ─".repeat(30)));
            const code = lines.join("\n");

            const { codeQuestion } = await inquirer.prompt([
                {
                    type: "input",
                    name: "codeQuestion",
                    message: "What would you like to know about this code?",
                    prefix: "🎯",
                    default: "Explain what this does"
                }
            ]);

            if (agentType === "all") {
                const spinner = ora({
                    text: chalk.magenta("🎭 Gathering perspectives from all agents..."),
                    spinner: "dots"
                }).start();
                
                const responses = await agentManager.explainWithAll(code, codeQuestion || undefined);
                spinner.stop();
                displayAllResponses(responses);
            } else {
                const agent = AGENTS[agentType];
                const spinner = createAgentSpinner(agent.key, agent.emoji);
                spinner.start();
                
                const response = await agentManager.explain(agentType, code, codeQuestion || undefined);
                spinner.stop();
                displayResponse(response);
            }

        } else if (inputType === "question") {
            const { generalQuestion } = await inquirer.prompt([
                {
                    type: "input",
                    name: "generalQuestion",
                    message: "What would you like to know?",
                    prefix: "💬"
                }
            ]);

            const targetAgent = agentType === "all" ? "eli5" as PersonaKey : agentType;
            const agent = AGENTS[targetAgent];
            
            const spinner = createAgentSpinner(agent.key, agent.emoji);
            spinner.start();
            
            const response = await agentManager.explain(
                targetAgent,
                `[General question about the codebase - no specific code provided]`,
                generalQuestion
            );
            
            spinner.stop();
            displayResponse(response);
        }

        // Ask if they want to continue chatting
        const { continueChat } = await inquirer.prompt([
            {
                type: "confirm",
                name: "continueChat",
                message: "Would you like to ask something else?",
                prefix: "💭",
                default: true
            }
        ]);

        if (!continueChat) {
            running = false;
        }
    }

    // Cleanup
    const shutdownSpinner = ora({
        text: chalk.gray("Saying goodbye to the agents..."),
        spinner: "dots"
    }).start();
    
    await agentManager.shutdown();
    for (const conn of mcpConnections) {
        await disconnectMcpServer(conn);
    }
    
    shutdownSpinner.stop();
    showGoodbye();
}

main().catch(console.error);
