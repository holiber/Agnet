# Required labels policy

The repo should have next labels for tickets (issues)

You can find more info about these labels in the **contributing_issues_labels.md** policy

### research
Color: #6F42C1 (purple)

Research tickets are used for information gathering, exploration, and analysis.

### plan
Color: #0EA5E9 (blue)

Plan tickets describe work that will later be split into multiple executable tasks.
They are often created after discussions (meetings, chats, brainstorming).

### aigenerated
Color: #F59E0B (amber)

This label marks tickets that were created by AI agents.

### epic
Color: #DC2626 (red)

Epic tickets represent large initiatives that consist of multiple tasks and are typically divided into **Tiers**.
A task qualifies as an Epic if it can be meaningfully split into staged delivery levels.
The recommended name for Tiers subtickets:

🧩 ShortFeatureSlug Ttier_order shortDescription

Example:

🧩 auth-flow T1_10 Add scenario tests

## ⚙️ Programmatic Label Management (GitHub API)
### Create a Label
```

curl -X POST \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/OWNER/REPO/labels \
  -d '{
    "name": "research",
    "color": "6F42C1",
    "description": "Information gathering, exploration, analysis. No production code changes."
  }'
```


### Update an Existing Label
```
curl -X PATCH \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/OWNER/REPO/labels/research \
  -d '{
    "new_name": "research",
    "color": "6F42C1",
    "description": "Research, analysis, experiments. Suggestions allowed, no main code changes."
  }'
```

🤖 AI-Agent Notes

Labels must be created exactly once

AI agents may:

Verify label existence

Update descriptions if policy changes

AI agents must not invent new labels unless explicitly instructed
