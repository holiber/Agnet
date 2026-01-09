---
version: 0.2.0
icon: 📜
tags:
  - policy
  - contributing
title: Policy Change Rules
description: Defines how policies are created, modified, and versioned.
---

Purpose

This policy defines how new policies are created and how existing policies are changed.

Its goal is to keep project governance clear, minimal, consistent, and understandable by both humans and AI agents.

⸻

Policy Language
	•	Policies must be written in English unless explicitly stated otherwise in the policy index
	•	Language must be clear, explicit, and deterministic

⸻

When a Policy Change Is Required

A policy proposal is required when:
	•	Introducing a new policy
	•	Modifying existing rules or constraints
	•	Clarifying ambiguous or unsafe behavior
	•	Adjusting rules that affect AI or human execution

⸻

Proposal Requirement

All policy changes must start with a proposal.

Rules:
	•	The proposal must use the proposal label
	•	Proposals may be created by humans or AI agents
	•	AI agents must follow contributing_ai_proposal

⸻

Policy Text Requirements

Each policy must:
	•	Explain its goal
	•	Be as short as possible while remaining clear
	•	Be understandable by humans and AI agents
	•	Use explicit language (must, must not, should)
	•	Avoid implicit assumptions

Policies are contracts, not recommendations by default.
If any rule is a recommendation, the policy must explicitly state this.

⸻

Policy Metadata (Optional)

A policy may include a YAML metadata header at the top of the file.

Supported fields:
	•	version — policy version (default: 0.1.0)
	•	icon — single emoji
	•	tags — list of search tags
	•	title — human-readable title
	•	description — short summary

Defaults:
	•	If title is missing → the first heading is the title
	•	If description is missing → the first paragraph after the first heading is the description

Metadata must not change or override policy rules.

⸻

Structure of a Policy

Recommended structure:

# Policy Title

## Purpose
## Rules
## Examples (optional)


⸻

Code Examples
	•	Code examples are allowed
	•	Examples must be minimal and correct
	•	Examples must not contradict the rules
	•	Examples are optional

⸻

Approval & Safety Rules
	•	Policies must be reviewed before adoption
	•	Policies must not contradict existing policies
	•	Conflicts require a new proposal to resolve

⸻

AI Agent Constraints
	•	AI agents must not modify policy files directly
	•	AI agents may propose changes or clarifications
	•	Applying a policy change requires human approval

⸻

General Principles
	•	Policies are contracts, not recommendations by default
	•	Explicit rules are preferred over implicit intent
	•	Fewer policies are better than many unclear ones
	•	Clarity is more important than completeness
	•	If a policy cannot be followed by an AI agent, it must be revised
