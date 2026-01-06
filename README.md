<p align="center">
  <img alt="Agnet logo" src="media/agnet-logo.png" />
</p>

Agnet is a small TypeScript library + CLI for working with **agents** and **tasks** using an A2A-aligned model.

## Quick start (local mock agent)

This repo ships a deterministic `mock-agent` runtime (used for tests). You can use it to try the API locally:

```ts
import process from "node:process";

import { Agnet } from "./src/agnet.js";

const agnet = new Agnet();

// Register the mock agent runtime (CLI/stdio).
agnet.register({
  agent: {
    id: "mock-agent",
    name: "Mock Agent",
    version: "0.0.0",
    skills: [{ id: "chat" }],
    // Optional: mark as default to make resolution deterministic.
    extensions: { default: true }
  },
  runtime: {
    transport: "cli",
    command: process.execPath,
    args: ["./bin/mock-agent.mjs"]
  }
});

const response = await agnet.ask("What is 2 + 2?");
console.log(response);
```

## Human vs Computer APIs

Agnet intentionally offers two parallel styles:

- **Human-style**: `agnet.ask(request) -> Promise<string>`
  - Minimal mental overhead, great for scripts/REPL/README examples
  - **Syntax sugar for**: `agnet.tasks.create(request).response()`
- **Computer-style**: `agnet.prompt(request) -> Promise<TaskResult>`
  - Structured result with metadata/events (provider-dependent)
  - **Syntax sugar for**: `agnet.tasks.create(request).result()`

## Unified request input (`TAgentRequest`)

All entrypoints accept the same request input:

```ts
export type TAgentRequest =
  | string
  | {
      agentId?: string;
      prompt: string;
    };
```

Rules:

- If you pass a **string**, it’s treated as `{ prompt: "<string>" }`.
- If `agentId` is omitted, Agnet resolves a default agent deterministically:
  - an agent with `agent.extensions.default === true` (if present)
  - otherwise, the **last registered** agent

## Examples

### Ask (text-only)

```ts
const response = await agnet.ask("Hello!");
console.log(response);
```

### Prompt (structured)

```ts
const result = await agnet.prompt("Hello!");
console.log(result.text, result.agentId);
```

### Explicit Task handle

```ts
const task = agnet.tasks.create({ prompt: "Hello!" });
console.log(await task.response()); // string
console.log(await task.result());   // TaskResult
```
