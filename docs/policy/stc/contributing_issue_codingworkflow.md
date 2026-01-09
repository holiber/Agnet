---
version: 0.2.0
icon: 🛠️
tags:
  - coding
  - workflow
  - ci
  - ai
title: Coding Workflow
description: Defines the required workflow for implementing code changes in issues.
---

Purpose

This policy defines the required workflow for working on issues that involve code changes.

Its goal is to ensure that code changes are correct, testable, consistent, and safe for both humans and AI agents.

⸻

Scope

This policy applies to any issue that requires writing, modifying, or deleting code.

⸻

Workflow Summary
	1.	Assign the issue to yourself
	2.	Implement changes following contributing_code_low
	3.	Validate changes during development
	4.	Complete the Before-Push Self-Check
	5.	Push changes and wait for CI
	6.	Mark PR as ready for review

⸻

Assignment

Before starting work:
	•	Assign the issue to yourself
	•	An issue must have a clear owner before code changes begin

⸻

Implementation

While writing code:
	•	Follow contributing_code_low
	•	Prefer reuse over duplication
	•	Keep the implementation as small and simple as possible

⸻

Mid-Development Validation

During implementation, when reasonable:
	•	Run a fast smoke test to verify that core functionality still works
	•	Smoke tests are intended to catch obvious breakages early

⸻

Tests & Coverage

After completing business logic:
	•	Think about which tests should be:
	•	Added
	•	Updated
	•	Removed
	•	Tests must reflect the new or changed behavior

⸻

Before-Push Self-Check (Required for Humans and AI Agents)

This checklist is mandatory for both human contributors and AI agents.

Additional rule for AI agents:
	•	AI agents must include the completed checklist in the Pull Request description
	•	Checklist items must be explicitly checked ([x]) or clearly explained if not applicable

Before pushing changes, all items below must be verified:
	•	Issue is assigned to me
	•	Code follows contributing_code_low
	•	Core functionality works (fast smoke test)
	•	Business logic is complete
	•	Relevant tests were added or updated
	•	npm run test passes
	•	No dead or unused code is left
	•	Existing code was reused where possible
	•	Code was reviewed for simplicity and size reduction
	•	If legacy code was kept for compatibility, it is explicitly mentioned in the PR description

⸻

Push, CI & Review
	•	Push changes only after completing the self-check
	•	Ensure all CI checks complete successfully
	•	Mark the PR as Ready for Review only after CI passes

⸻

AI Agent Rules (IMPORTANT)

When executed by an AI agent:
	•	The agent must follow this workflow and checklist
	•	The agent must follow contributing_ai_codingworkflow
	•	The agent must post the completed Before-Push Self-Check in the PR description
	•	If any checklist item cannot be completed:
	•	The agent must stop
	•	The agent must describe the problem directly in the issue
	•	The issue must be marked with the help needed label

⸻

General Principles
	•	Ownership before action
	•	Checklists reduce mistakes
	•	CI is a hard gate
	•	Dead code is technical debt
	•	Compatibility exceptions must be explicit
	•	Smaller, clearer code is always preferred
	•	If unsure, stop and clarify

