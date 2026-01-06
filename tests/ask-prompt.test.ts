import { describe, expect, it } from "vitest";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { Agnet } from "../src/agnet.js";

function mockAgentPath(): string {
  return fileURLToPath(new URL("../bin/mock-agent.mjs", import.meta.url));
}

function registerMockAgent(params: { agnet: Agnet; id: string; isDefault?: boolean }): void {
  params.agnet.register({
    agent: {
      id: params.id,
      name: "Mock Agent",
      version: "0.0.0",
      skills: [{ id: "chat" }],
      ...(params.isDefault ? { extensions: { default: true } } : {})
    },
    runtime: {
      transport: "cli",
      command: process.execPath,
      args: [mockAgentPath(), "--chunks=4", "--streaming=on"]
    }
  });
}

describe("ask/prompt sugar + unified request input", () => {
  it("agnet.ask(request) matches tasks.create(request).response()", async () => {
    const agnet = new Agnet();
    registerMockAgent({ agnet, id: "mock-agent", isDefault: true });

    const a = await agnet.ask("hello");
    const b = await agnet.tasks.create("hello").response();
    expect(a).toBe(b);
    expect(a).toBe("MockTask response #1: hello");
  });

  it("agnet.prompt(request) matches tasks.create(request).result() (text + agentId)", async () => {
    const agnet = new Agnet();
    registerMockAgent({ agnet, id: "mock-agent", isDefault: true });

    const a = await agnet.prompt("hello");
    const b = await agnet.tasks.create("hello").result();

    expect(a.text).toBe(b.text);
    expect(a.agentId).toBe(b.agentId);
    expect(a.text).toBe("MockTask response #1: hello");
  });

  it("accepts string shorthand and object input consistently", async () => {
    const agnet = new Agnet();
    registerMockAgent({ agnet, id: "mock-agent", isDefault: true });

    const a = await agnet.ask("hi");
    const b = await agnet.ask({ prompt: "hi" });
    expect(a).toBe(b);
  });

  it("resolves default agent deterministically (default marker first, otherwise last registered)", async () => {
    const agnet = new Agnet();

    registerMockAgent({ agnet, id: "a1" });
    registerMockAgent({ agnet, id: "b1", isDefault: true });

    const r1 = await agnet.prompt("x");
    expect(r1.agentId).toBe("b1");
    expect(r1.task?.agentId).toBe("b1");

    const agnet2 = new Agnet();
    registerMockAgent({ agnet: agnet2, id: "a2" });
    registerMockAgent({ agnet: agnet2, id: "b2" });

    const r2 = await agnet2.prompt("x");
    expect(r2.agentId).toBe("b2");
    expect(r2.task?.agentId).toBe("b2");

    const r3 = await agnet2.prompt({ agentId: "a2", prompt: "x" });
    expect(r3.agentId).toBe("a2");
    expect(r3.task?.agentId).toBe("a2");
  });
});

