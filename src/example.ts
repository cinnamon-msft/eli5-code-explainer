/**
 * Example: Using ELI5 Explainer as a library
 */
import { ELI5Explainer } from "./api.js";

// Sample code to explain
const sampleCode = `
class EventEmitter {
    private listeners: Map<string, Function[]> = new Map();

    on(event: string, callback: Function): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(callback);
    }

    emit(event: string, ...args: any[]): void {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(cb => cb(...args));
        }
    }

    off(event: string, callback: Function): void {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
}
`;

async function main() {
    console.log("🎯 ELI5 Explainer - Library Example\n");

    const explainer = new ELI5Explainer();
    await explainer.init();

    // Example 1: Get a simple ELI5 explanation
    console.log("━".repeat(60));
    console.log("📚 Example 1: Simple ELI5 Explanation\n");
    
    const eli5 = await explainer.eli5(sampleCode);
    console.log("🧒 ELI5 says:");
    console.log(eli5);

    // Example 2: Get a technical breakdown
    console.log("\n" + "━".repeat(60));
    console.log("📚 Example 2: Technical Deep-Dive\n");
    
    const tech = await explainer.technical(sampleCode);
    console.log("🔬 Tech Expert says:");
    console.log(tech);

    // Example 3: Ask a specific question
    console.log("\n" + "━".repeat(60));
    console.log("📚 Example 3: Specific Question\n");
    
    const answer = await explainer.eli5(
        sampleCode,
        "Why do we use a Map instead of an object?"
    );
    console.log("❓ Question: Why do we use a Map instead of an object?");
    console.log("🧒 Answer:", answer);

    // Example 4: Get the roast
    console.log("\n" + "━".repeat(60));
    console.log("📚 Example 4: Code Roast\n");
    
    const roast = await explainer.roast(sampleCode);
    console.log("🔥 Roaster says:");
    console.log(roast);

    // Cleanup
    await explainer.close();
    console.log("\n✅ Done!");
}

main().catch(console.error);
