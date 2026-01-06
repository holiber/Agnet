# Agent Runtimes in the Wild

This document summarizes how popular agent-based systems model
execution, sessions, and long-lived state.

The goal is not to copy any specific system, but to ensure
AgentInterop’s Runtime model aligns with real-world practice.

## Key Observations

- Most agent systems have a long-lived runtime, even if it is not exposed.
- Multiple sessions per runtime is common for IDE and code agents.
- Runtime/container metadata is rarely exposed via public APIs.
- Containerization is an implementation detail, not part of the API contract.

## Comparison Table

| System | Runtime | Multi-session | Runtime exposed | Notes |
|------|--------|---------------|-----------------|------|
| Cursor Cloud | Yes | Implicit | No | Runtime hidden |
| OpenHands | Yes | Partial | Partial | runtimeId exposed |
| Cline | No | No | No | Stateless |
| Roo Code | Semi | No | No | Editor-scoped |
| Continue | Semi | No | No | Workspace-scoped |
| OpenAI Assistants | Yes | Yes | Partial | Assistant = runtime |
| SWE-agent | Yes | Usually 1 | No | Container-per-task |

## Implications for AgentInterop

- Runtime is a first-class internal concept.
- Runtime identity is optional in public APIs.
- Session and Task APIs remain A2A-compatible.
- Isolation (shared vs dedicated runtime) is a policy, not a protocol feature.
