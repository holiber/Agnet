---
version: 0.1.0
icon: 🤖
tags:
  - ai
  - coding
  - workflow
  - execution
title: AI Coding Workflow
description: Defines the mandatory staged workflow AI agents must follow when implementing coding tasks.
---

Purpose

This policy defines the mandatory workflow AI agents must follow when implementing issues that require code changes.

Its goal is to:
	•	Make AI work observable and auditable
	•	Prevent premature coding
	•	Ensure correct use of context, policies, and intent
	•	Allow safe handoff between agents

⸻

Scope

This policy applies to any coding task executed by an AI agent, regardless of whether it was initiated via autocode or manual assignment.

⸻

High-Level Workflow

Each coding task must be implemented in three stages:
	1.	Intent Validation
	2.	Context Collection
	3.	Build & Delivery

Each stage consists of multiple steps and has a progress indicator.

⸻

Progress Indicators (Required)

Progress indicators must be added to the beginning of the issue title.

Indicator	Meaning
⚪️	Stage not started
🟠	Stage started
🟡	Stage ≥ 50% completed
🟢	Stage completed
⏰	Stage stopped due to time limit
⛔️	Stage failed

Initial State

When starting work, the issue title must be updated to:

⚪️⚪️⚪️ <Issue title>

Order of indicators:

[Intent][Context][Build]


⸻

Stage 1: Intent Validation

Goal

Ensure the issue has a clear, explicit purpose and motivation.

⸻

Step 1.1 — Validate Intent Section

Check that the issue contains the following section:

## Intent

### What we are doing
### Why we are doing this

Rules:
	•	If the section is missing or incomplete:
	•	The AI agent must add it
	•	Fill it with concise, explicit content

⸻

Completion Criteria
	•	Intent section exists
	•	Both subsections are clear and non-duplicative

Update issue title to:

🟢⚪️⚪️ <Issue title>


⸻

Stage 2: Context Collection

Goal

Collect all necessary context before writing code.

The agent must externalize reasoning in the issue.

⸻

Step 2.1 — Related Issues & Dependencies

Create sections:

## Context
## Related Issues

Actions:
	•	Review parent issues
	•	Review linked or related open/closed issues
	•	Document assumptions and dependencies

Update progress when starting:

🟢🟠⚪️ <Issue title>


⸻

Step 2.2 — Useful Files, Docs, External Sources

Add section:

## Context / Useful Files and Docs

Actions:
	•	Identify relevant local files
	•	Identify relevant documentation
	•	Include external URLs if applicable
	•	Clearly mark assumptions

⸻

Step 2.3 — Applicable Policies

Add section:

## Context / Policies to Apply

Actions:
	•	List all policies expected to apply
	•	Include policy file names explicitly

⸻

Step 2.4 — Types, Interfaces, Public APIs

Add section:

## Context / Types, Interfaces, Code Shapes

Actions:
	•	Describe expected data shapes
	•	Describe public methods or APIs
	•	Focus on entities and contracts, not implementation
	•	Include short illustrative examples if helpful

⸻

Step 2.5 — Modules, Technologies, File Plan

Add section:

## Context / Modules, Technologies, File Changes

Actions:
	•	Identify modules, packages, or technologies to use
	•	List files to create, update, or delete
	•	Include a proposed file tree if helpful

⸻

Context Progress Rules
	•	When ≥ 50% of Context steps are complete:

🟢🟡⚪️ <Issue title>


	•	When all Context steps are complete:

🟢🟢⚪️ <Issue title>



⸻

Stage 3: Build & Delivery

Goal

Implement, validate, and deliver the solution safely.

⸻

Step 3.1 — Implement Business Logic

Add section:

## Build / Business Logic

Actions:
	•	Implement core functionality
	•	Use collected context as guidance
	•	If plans change:
	•	Document changes directly in the issue

⸻

Step 3.2 — Tests

Add section:

## Build / Tests

Actions:
	•	Identify tests to add or update
	•	Ensure coverage matches behavior changes

⸻

Step 3.3 — Policy & Requirement Check

Add section:

## Build / Policy and Requirement Check

Actions:
	•	Verify compliance with all required policies
	•	Re-read:
	•	AGENT.md
	•	CONTRIBUTING.md
	•	Complete the Before-Push Self-Check
	•	Push changes only after all checks pass

⸻

Step 3.4 — CI & Review Readiness

Add section:

## Build / CI Status

Actions:
	•	Wait for CI to complete
	•	Fix failures if any
	•	Mark PR as Ready for Review once CI is green

⸻

Completion

When Build stage is complete:

🟢🟢🟢 <Issue title>

After merge:

🟢🟢🟢🚀 <Issue title>


⸻

Time Limits & Failure Handling

Time Limit
	•	Maximum allowed time per step: 40 minutes

If time limit is reached:
	•	Stop work
	•	Report status in the issue
	•	Update indicator, for example:

🟢⏰⚪️ <Issue title>


⸻

Failure Handling

If a step cannot be completed for any reason:
	•	Document the reason in the issue
	•	Update indicator, for example:

🟢🟢⛔️ <Issue title>

It is often recommended to start a new AI agent for the next step.

⸻

Metrics Reporting (Required)

After each step, the AI agent must add metrics badges to the issue:
	•	Time spent
	•	Model used
	•	Token usage (input / output)
	•	Link to the AI chat

If any data is unavailable, use n/a.

⸻

General Principles
	•	Think before coding
	•	Externalize reasoning
	•	One stage at a time
	•	Progress must always be visible
	•	Stopping is better than guessing
