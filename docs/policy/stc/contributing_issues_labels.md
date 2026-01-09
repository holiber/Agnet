# Ticket types policy

This policy defines how tasks (tickets) are created, labeled, structured, and executed within the project.
It explicitly accounts for the fact that tasks may be created and executed by **AI agents** as well as humans.

---

## 1. Ticket Labels

### 1.1 Research Tickets

**Purpose**
Research tickets are used for information gathering, exploration, and analysis.

**Rules**
* The ticket has *research* label
* The main project code **must not be modified**.
* Code **experiments or prototypes** may be created if necessary in docs/research
* The outcome is **knowledge**, not implementation.

**Deliverables**

* If results are small → write them directly in the ticket.
* If results are large → create a folder:

  ```
  docs/ticket/:ticket_id/
  ```

  containing:

  * Markdown files with findings
  * References, data, and experiments
  * Any experimental code related to the research

**Output Expectations**

* Clear conclusions
* Actionable recommendations
* Explicit suggestions for potential code changes (if applicable)

---

### 1.2 Plan Tickets

**Purpose**
Plan tickets describe work that will later be split into multiple executable tasks.

They are often created after discussions (meetings, chats, brainstorming).

**Rules**
* The ticket has *plan* label
* A Plan ticket may:

  * Explicitly list future tasks, or
  * Contain a high-level description or TODO list
* When a Plan ticket is processed (usually by an AI agent):

  * All implied work **must be converted into concrete tasks**
  * Missing task definitions must be inferred and created

**Output Expectations**

* A clear, structured list of tasks
* Tasks must be independently actionable
* Ambiguities should be resolved or explicitly documented

---

### 1.3 AI-Generated Tickets

**Purpose**
This label marks tickets that were created by AI agents.

**Rules**
* The ticket has *aigenerated* label
* The label is informational only
* AI-generated tickets follow the same quality standards as human-created tickets
* Humans may later refine or merge them if needed

---

### 1.4 Epic Tickets

**Purpose**
Epic tickets represent large initiatives that consist of multiple tasks and are typically divided into **Tiers**.

A task qualifies as an Epic if it can be meaningfully split into staged delivery levels.

* The recommended name for Tiers subtickets: 🧩 ShortFeatureSlug T1_10 Add scenario tests

---

## 2. Epic Tiers

### Tier 0 — Research & Planning (Optional)

**Purpose**

* Gather knowledge
* Define requirements for future tiers
* Reduce uncertainty

**Rules**
* The ticket has *epic* label
* No requirement to finalize:

  * Database choices
  * Exact schemas
  * Final architectures
* It is acceptable to provide examples instead of decisions

**Expected Outcomes**

* Clear problem definition
* Constraints and assumptions
* Scalability expectations (e.g. MVP = 1,000 records, Release = 100,000 records)

**Mandatory Final Task**

* Create a **Plan document (Markdown)** that will be used to generate tasks for the next tiers
* The document must include:

  * Clear context (what and why)
  * High-level approach
  * Optional glossary to reduce repetition in future tasks

---

### Tier 1 — MVP (Fast Value Delivery)

**Purpose**

* Deliver a working MVP as fast as possible

**Rules**

* Focus on:

  * 20% effort → 80% value
  * Core or “killer” feature
* Prefer **simple and pragmatic solutions**

  * Example:

    * SQLite instead of PostgreSQL
    * File system instead of a database
* Mocked or simplified data is allowed
* Edge cases and scalability are **not required** to be fully handled

**Best Practices**

* If known edge cases or future scalability issues exist:

  * Explicitly document them

**Mandatory Final Task**

* Review Tier 1 findings
* Adjust or refine tasks for Tier 2 and beyond based on new insights

---

### Tier 2 — Alpha / Beta Quality

**Purpose**

* Make the solution fully usable

**Rules**

* No mock data
* Final UI/UX design must be applied
* All new functionality must be covered by tests

**Expected State**

* Stable and usable product
* Ready for internal or limited external usage

---

### Tier 3 — Release Quality

**Purpose**

* Prepare the solution for release

**Rules**

* All code must be:

  * Reviewed
  * Tested again
* Verify that **all original requirements** are fulfilled
* Detect and eliminate:

  * Duplicate functionality
  * Different implementations of the same logic across files
* If issues are found:

  * Create follow-up tasks

**Mandatory Deliverables**

* Documentation or specification
* Release notes text
* Code metrics:

  * Lines added / removed
  * New libraries
  * Tests added
* UI work must include at least **one Human E2E Test**:

  * A full UI flow
  * With realistic delays between interactions


### Tier 4 — Nice-to-Have (Post-Release)

**Purpose**

* Non-critical improvements and ideas

**Examples**

* Enhancements that can be postponed
* Experimental ideas
* Marketing or promotion suggestions
* Tasks that may never be implemented

## 3. Notes on Tier Usage

* Not all Epics require all tiers
* Some Epics may be fully completed with only Tier 1–2
* Tiers exist to **control complexity and decision timing**, not to over-plan early

## 4. General Principles (For AI and Humans)

* Prefer clarity over perfection
* Make assumptions explicit
* Convert ambiguity into documented decisions or follow-up tasks
* Optimize for incremental value delivery
* Always leave the system in a better-documented state than before
