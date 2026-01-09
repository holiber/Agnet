---
version: 0.1.0
icon: 📦
tags:
  - code
  - style
  - structure
  - refactor
title: Low-Level Code Structure Guidelines
description: Defines pragmatic rules for file size, module structure, and refactoring thresholds.
---

contributing_code_low.md

Purpose

This policy defines low-level code structure rules.

Its goal is to:
	•	Reduce unnecessary fragmentation
	•	Keep code easy to read and navigate
	•	Avoid premature abstraction
	•	Provide clear refactoring thresholds for humans and AI agents

⸻

General Principle

Prefer fewer files and directories unless splitting clearly improves readability or maintainability.

Do not create structure “for the future” without a concrete need.

⸻

New Modules

When creating a new module:
	•	It is allowed and preferred to start with a single file
	•	Keep everything in one file while the file size is under 400 lines

This applies to:
	•	Logic
	•	Types
	•	Helpers
	•	Small utilities related to the same responsibility

⸻

Splitting into Multiple Files

Start splitting a module into multiple files when:
	•	A single file exceeds ~400 lines, or
	•	Responsibilities become clearly separable

Splitting should be:
	•	Intentional
	•	Based on responsibility, not size alone

Avoid creating deep or complex directory trees without necessity.

⸻

Large Classes

If functionality is implemented as a single class:
	•	The class may contain up to ~1500 lines
	•	This is allowed to avoid artificial splitting

When a class exceeds this size:
	•	Refactoring is recommended
	•	A note or follow-up task should be created suggesting refactoring

This is a recommendation, not an immediate hard failure.

⸻

Refactoring Guidance

Refactor when:
	•	Code becomes difficult to reason about
	•	Responsibilities are mixed
	•	Duplication appears across files or classes

Do not refactor preemptively without clear benefit.

⸻

AI Agent Notes
	•	AI agents must follow these limits when generating code
	•	If a limit is exceeded:
	•	Prefer leaving a clear note or TODO
	•	Suggest refactoring instead of performing risky restructuring automatically

⸻

General Principles
	•	Simplicity over architecture
	•	Fewer files > many tiny files
	•	Readability beats theoretical purity
	•	Refactor when pain appears, not before

