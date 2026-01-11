🤖 BigBoss — your repo’s “get-things-done” assistant (1-page)

BigBoss is a GitHub Actions–hosted helper that wakes up on a schedule and on human commands (slash commands / mentions) anywhere: Issues, PRs, Discussions.
It runs through cursor-cli + MCP servers, can delegate work to Cursor Cloud agents, and keeps persistent state in its own Discussion so you don’t lose context between runs.

What you get (features, but readable)

✅ Wake-up triggers

BigBoss runs when:
	•	someone writes a command in Issue / PR / Discussion
	•	someone mentions it with natural language
	•	the cron schedule fires (health + housekeeping)

✅ Commands anywhere (same syntax everywhere)

Examples:
	•	@bigboss /do — do “this” (current thread context)
	•	/bigboss do #12 — do issue/PR/task #12
	•	@bigboss /do <link> — do a linked item

Also works:
	•	@bigboss can you make an epic issue from task 19?

✅ Rules & commands are Markdown (no hidden magic)

Rules live as .md files and are loaded dynamically at runtime:
	•	loadRules("./.github/workflows/bigboss/rules/*.md")

✅ Pre-gate before any work

Before BigBoss actually runs, it goes through:

shouldWakeUpAgent(event, body, context)

This blocks:
	•	random slash-command noise
	•	accidental triggers
	•	duplicate runs
	•	“don’t do this now, another agent is editing the same area” situations (later enhancement)

✅ MCP + Cursor Cloud (expandable)

We install cursor-cli with caching and start MCP servers:
	•	PlaywrightMCP
	•	ChromeDevToolsMCP
	•	OpenAPIMCP (with Cursor Cloud API OpenAPI YAML)

Minimal version: MCP health check only
Next version: use OpenAPIMCP to delegate tasks into Cursor Cloud and post links

✅ Persistent memory (human-visible)

On first run BigBoss:
	•	ensures Discussions are enabled (or fails loudly with instructions)
	•	creates a “BigBoss State” Discussion
	•	first message stores JSON/YAML state:
	•	active tasks
	•	related issues/PRs
	•	delegated agent links (later)

✅ Safe by default

BigBoss does not review or merge unless explicitly asked.
If asked to do something risky, it must warn and require explicit intent.

✅ “No silent failure” rule

Unexpected errors must be:
	•	caught
	•	logged
	•	posted to the BigBoss discussion (what failed, where, what was skipped, retry hints)

⸻

How it looks in real life (quick demo)

Human writes in a PR comment:

@bigboss /do

BigBoss replies (comment):
	•	“Got it. I’m taking this task.”
	•	Runs a health check (cursor-cli, MCP, rules)
	•	Creates/updates its state discussion
	•	Posts progress + final outcome

If there’s no context:

/bigboss do #12

If user asks in plain English:

@bigboss can you make an epic issue from task 19?

BigBoss treats it like a command.

⸻

Install (max short) ✅

Everything goes into one folder:

.github/workflows/bigboss/

You add 5 files (minimum working set):

.github/workflows/bigboss/
  workflow.yml
  run.sh
  agent.yml
  mcp.js
  rules/
    commands.md

You also add 2 GitHub secrets:
	•	CURSOR_CLOUD_API_KEY (optional for minimal; needed later)
	•	GITHUB_TOKEN is already available in Actions

Then push to default branch.

⸻

Configuration (tiny, readable)

.github/workflows/bigboss/agent.yml

agent_name: bigboss
schedule_cron: "*/30 * * * *"

rules_glob: ".github/workflows/bigboss/rules/*.md"

# minimal mode first; we’ll expand later
use_mcp:
  playwright: true
  chrome_devtools: true
  openapi: true

cursor_cloud:
  enabled: false
  openapi_yaml: ".github/workflows/bigboss/cursor-cloud.openapi.yml"


⸻

Minimal working script (runs + prints what it sees)

.github/workflows/bigboss/run.sh

#!/usr/bin/env bash
set -euo pipefail

echo "== BigBoss boot =="
echo "Actor: ${GITHUB_ACTOR:-unknown}"
echo "Repo : ${GITHUB_REPOSITORY:-unknown}"
echo "Event: ${GITHUB_EVENT_NAME:-unknown}"

echo
echo "== Event payload head =="
head -c 2000 "${GITHUB_EVENT_PATH}" || true
echo
echo

echo "== Rules =="
ls -la .github/workflows/bigboss/rules || true
echo

echo "== shouldWakeUpAgent (minimal) =="
# Minimal gate: wake up only if comment body contains "/do" or mentions "@bigboss"
# We'll implement a real gate later.
BODY="$(python - << 'PY'
import json, os
p=os.environ.get("GITHUB_EVENT_PATH")
try:
  data=json.load(open(p))
except Exception:
  print("")
  raise SystemExit
body=""
# issue_comment, discussion_comment, pull_request_review_comment share "comment.body"
if isinstance(data, dict):
  body = (((data.get("comment") or {}).get("body")) or "")
print(body.replace("\r\n","\n"))
PY
)"

echo "Body:"
echo "$BODY"
echo

if echo "$BODY" | grep -Eqi '(^|\s)(/bigboss|@bigboss)\b|/do\b'; then
  echo "Wake-up: YES"
else
  echo "Wake-up: NO (exit)"
  exit 0
fi

echo
echo "== Cursor CLI (placeholder) =="
echo "TODO: install cursor-cli with caching (next step)"
echo

echo "== MCP (placeholder) =="
echo "TODO: start MCP servers and run health checks (next step)"
echo

echo "== Done (minimal run) =="

This already gives you a working “wakes up only on commands” baseline.

⸻

GitHub Actions workflow (minimal, but real)

.github/workflows/bigboss/workflow.yml

name: BigBoss Agent

on:
  schedule:
    - cron: "*/30 * * * *"
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
  discussion_comment:
    types: [created]
  workflow_dispatch: {}

permissions:
  contents: read
  issues: write
  pull-requests: write
  discussions: write

jobs:
  bigboss:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Run BigBoss (minimal)
        shell: bash
        run: |
          chmod +x .github/workflows/bigboss/run.sh
          .github/workflows/bigboss/run.sh


⸻

Rules: commands list (super short)

.github/workflows/bigboss/rules/commands.md

# BigBoss Commands

## /do
Meaning: "take responsibility and finish this task"

Accepted forms:
- @bigboss /do
- /bigboss do #<number>
- @bigboss /do <link>

Safety:
- BigBoss does NOT merge or review unless explicitly asked.
- If task should be postponed or depends on another task, BigBoss must warn.


⸻

### Cursor cloud agents api online docs and openapi schema
https://cursor.com/docs/cloud-agent/api/endpoints#endpoints

https://cursor.com/docs-static/cloud-agents-openapi.yaml

^ use this schema for your OpenApiMCP

### Cursor CLI Install

curl https://cursor.com/install -fsS | bash

Set API key for scripts

export pCURSOR_API_KEY=your_api_key_here
agent -p "Analyze this code"

docs: https://cursor.com/docs/cli/headless
Dont forget setup permissions
