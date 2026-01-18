# 🧒 ELI5 Code Explainer

A multi-agent code explanation tool that uses the **GitHub Copilot SDK** and **MCP servers** to provide multiple perspectives on your code.

## 🎭 Meet the Agents

| Agent | Emoji | Style |
|-------|-------|-------|
| **ELI5** | 🧒 | Explains like you're 5 years old |
| **Tech Expert** | 🔬 | Deep technical analysis |
| **Analogy Master** | 🌉 | Real-world metaphors |
| **Code Roaster** | 🔥 | Constructive criticism with humor |

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run interactive mode
npm run dev

# Run demo with sample code
npm run demo
```

## 📖 Usage

### Interactive CLI

```bash
# Run in current directory
npm run dev

# Run in a specific directory
npm run dev D:\path\to\your\project
```

### Programmatic API

```typescript
import { ELI5Explainer } from "./src/api.js";

const explainer = new ELI5Explainer();
await explainer.init("./my-project");

// Get an ELI5 explanation
const eli5 = await explainer.eli5(`
  function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
  }
`);
console.log(eli5);

// Get all perspectives
const allExplanations = await explainer.explainAll(code);
for (const exp of allExplanations) {
  console.log(`${exp.emoji} ${exp.agent}: ${exp.explanation}`);
}

await explainer.close();
```

## 🎬 Demo Output

```
🧒 ELI5 Agent
────────────────────────────────────

Imagine you have a magic toy box! 🎁

When someone wants to play (login), they need to say the secret password.
But if they guess wrong too many times (5 tries!), the toy box gets 
grumpy and says "Come back later!"

If they say the right password, they get a special golden ticket (token) 
that lets them play for one whole day! ☀️

────────────────────────────────────

🔬 Tech Expert
────────────────────────────────────

**Overview**: JWT-based authentication with Redis rate limiting.

**Implementation Details**:
1. Rate limiting via Redis with 5-attempt threshold
2. Case-insensitive email lookup
3. bcrypt password verification
4. JWT token generation with 24h expiry

**Complexity**: O(1) for Redis operations, O(n) for bcrypt

**Potential Issues**:
- No constant-time comparison for user existence
- Missing password complexity validation

────────────────────────────────────

🌉 Analogy Master
────────────────────────────────────

Think of this like a nightclub with a bouncer! 🎉

**The Door (Login Attempts)**
There's a counter at the door. Get rejected 5 times? 
You're banned until the bouncer forgets (Redis TTL).

**The ID Check (Password)**
Show your ID (email) and whisper the password. 
The bouncer checks the VIP list (database).

**The Wristband (JWT)**
You're in? Here's a glow-in-the-dark wristband!
It expires at 2am (24 hours). After that, show ID again.

────────────────────────────────────

🔥 Code Roaster
────────────────────────────────────

*adjusts monocle* 

OH, we're doing security? Let me check my notes...

🔥 **The Roast**:
I see you're storing login attempts in Redis. Bold choice
for someone who'll forget to set the TTL one day.

Also, `email.toLowerCase()` - protecting against 
THOSE users since 2024.

💡 **The Fix**:
Add a TTL to those login attempts unless you want
infinite bans for typos.

👏 **The Praise**:
Actually solid use of bcrypt. Not bcrypt.js, not 
md5("password123"). Respect.

🎯 **Takeaway**: 7/10, would review again.

────────────────────────────────────
```

## 🛠️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ELI5 Code Explainer                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ 🧒 ELI5  │ │ 🔬 Tech  │ │ 🌉 Analogy│ │ 🔥 Roast │       │
│  │  Agent   │ │  Agent   │ │  Agent   │ │  Agent   │       │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │
│       │            │            │            │              │
│       └────────────┴────────────┴────────────┘              │
│                         │                                    │
│                  ┌──────┴──────┐                            │
│                  │ Agent       │                            │
│                  │ Manager     │                            │
│                  └──────┬──────┘                            │
│                         │                                    │
│           ┌─────────────┴─────────────┐                     │
│           │                           │                      │
│    ┌──────┴──────┐            ┌──────┴──────┐              │
│    │ Copilot SDK │            │ MCP Servers │              │
│    │  (GPT-5)    │            │             │              │
│    └─────────────┘            │ • Filesystem│              │
│                               │ • Git       │              │
│                               └─────────────┘              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 📦 MCP Servers Used

- **`@modelcontextprotocol/server-filesystem`** - Read files from your codebase
- **`@anthropic-ai/mcp-server-git`** - Access git history and blame

## 🔧 Configuration

### Environment Variables

```env
# Optional: Specify Copilot CLI path
COPILOT_CLI_PATH=/path/to/copilot
```

### Adding New Agents

Create a new persona in `src/agents/personas.ts`:

```typescript
export const AGENT_PERSONAS = {
  // ... existing agents ...
  
  pirate: {
    name: "Pirate Explainer",
    emoji: "🏴‍☠️",
    description: "Explains code like a pirate",
    systemPrompt: `Arr! Ye be explainin' code like a true buccaneer!
                   Use pirate speak and nautical metaphors.`
  }
};
```

## 📝 License

MIT

## 🙏 Credits

Built with:
- [GitHub Copilot SDK](https://github.com/github/copilot-sdk)
- [Model Context Protocol](https://modelcontextprotocol.io)
