import { describe, expect, it } from "vitest";
import process from "node:process";

import { Agnet } from "../../src/agnet.js";

describe("README examples (executed)", () => {
  it("quick start + ask/prompt/tasks.create", async () => {
    const agnet = new Agnet();

    // Mirrors the README "Quick start (local mock agent)" snippet.
    agnet.register({
      agent: {
        id: "mock-agent",
        name: "Mock Agent",
        version: "0.0.0",
        skills: [{ id: "chat" }],
        extensions: { default: true }
      },
      runtime: {
        transport: "cli",
        command: process.execPath,
        args: ["./bin/mock-agent.mjs"]
      }
    });

    const response = await agnet.ask("What is 2 + 2?");
    expect(response).toBe("MockTask response #1: What is 2 + 2?");

    const result = await agnet.prompt("Hello!");
    expect(result.text).toBe("MockTask response #1: Hello!");
    expect(result.agentId).toBe("mock-agent");

    const task = agnet.tasks.create({ prompt: "Hello!" });
    expect(await task.response()).toBe("MockTask response #1: Hello!");
  });
});

