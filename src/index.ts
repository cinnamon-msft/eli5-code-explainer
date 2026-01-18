import inquirer from "inquirer";
import { AgentManager } from "./manager.js";
import { PersonaKey } from "./personas.js";
import { connectFilesystemMcp, connectGitMcp, disconnectMcpServer, McpConnection } from "./mcp/client.js";
import { displayWelcome, displayResponse, displayAllResponses, displayAgentMenu, showError } from "./ui/display.js";
import chalk from "chalk";

async function main() {
    displayWelcome();

    // Get the working directory
    const workingDir = process.argv[2] || process.cwd();
    console.log(chalk.gray(`📂 Working directory: ${workingDir}\n`));

    // Connect to MCP servers
    const mcpConnections: McpConnection[] = [];

    try {
        // Connect filesystem MCP
        const fsMcp = await connectFilesystemMcp(workingDir);
        mcpConnections.push(fsMcp);

        // Try to connect git MCP (may fail if not a git repo)
        try {
            const gitMcp = await connectGitMcp(workingDir);
            mcpConnections.push(gitMcp);
        } catch (e) {
            console.log(chalk.yellow("⚠️  Not a git repository, git features disabled"));
        }
    } catch (error) {
        showError(`Failed to connect MCP servers: ${error}`);
        process.exit(1);
    }

    // Initialize agent manager
    const agentManager = new AgentManager();
    await agentManager.initialize(mcpConnections);

    // Main interaction loop
    let running = true;
    while (running) {
        displayAgentMenu();

        const { choice } = await inquirer.prompt([
            {
                type: "input",
                name: "choice",
                message: "Select agent:",
                default: "1"
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
            showError("Invalid choice. Please try again.");
            continue;
        }

        // Get input - file path or code snippet
        const { inputType } = await inquirer.prompt([
            {
                type: "list",
                name: "inputType",
                message: "What do you want to explain?",
                choices: [
                    { name: "📄 A file", value: "file" },
                    { name: "📝 Paste code", value: "code" },
                    { name: "❓ Ask about the codebase", value: "question" }
                ]
            }
        ]);

        let code = "";
        let question = "";

        if (inputType === "file") {
            const { filePath } = await inquirer.prompt([
                {
                    type: "input",
                    name: "filePath",
                    message: "Enter file path (relative to working directory):"
                }
            ]);

            const { fileQuestion } = await inquirer.prompt([
                {
                    type: "input",
                    name: "fileQuestion",
                    message: "Any specific question? (press Enter to skip):",
                    default: ""
                }
            ]);

            question = fileQuestion;

            try {
                const response = await agentManager.explainFile(filePath, agentType, question || undefined);
                
                if (Array.isArray(response)) {
                    displayAllResponses(response);
                } else {
                    displayResponse(response);
                }
            } catch (error) {
                showError(`Failed to read file: ${error}`);
            }

        } else if (inputType === "code") {
            console.log(chalk.gray("Paste your code (end with a line containing only 'END'):"));
            
            const lines: string[] = [];
            const readline = await import("readline");
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            await new Promise<void>((resolve) => {
                const readLine = () => {
                    rl.question("", (line) => {
                        if (line.trim() === "END") {
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

            code = lines.join("\n");

            const { codeQuestion } = await inquirer.prompt([
                {
                    type: "input",
                    name: "codeQuestion",
                    message: "Any specific question? (press Enter to skip):",
                    default: ""
                }
            ]);

            if (agentType === "all") {
                const responses = await agentManager.explainWithAll(code, codeQuestion || undefined);
                displayAllResponses(responses);
            } else {
                const response = await agentManager.explain(agentType, code, codeQuestion || undefined);
                displayResponse(response);
            }

        } else if (inputType === "question") {
            const { generalQuestion } = await inquirer.prompt([
                {
                    type: "input",
                    name: "generalQuestion",
                    message: "What would you like to know about this codebase?"
                }
            ]);

            // For general questions, we let the agent explore using MCP tools
            if (agentType === "all") {
                // For simplicity, just use eli5 for general questions
                const response = await agentManager.explain(
                    "eli5",
                    `[No specific code provided - this is a general question about the codebase]`,
                    generalQuestion
                );
                displayResponse(response);
            } else {
                const response = await agentManager.explain(
                    agentType,
                    `[No specific code provided - this is a general question about the codebase]`,
                    generalQuestion
                );
                displayResponse(response);
            }
        }
    }

    // Cleanup
    await agentManager.shutdown();
    for (const conn of mcpConnections) {
        await disconnectMcpServer(conn);
    }

    console.log(chalk.cyan("\n👋 Thanks for using ELI5 Code Explainer!\n"));
}

main().catch(console.error);
