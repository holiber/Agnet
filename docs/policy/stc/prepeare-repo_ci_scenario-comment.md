# Post video of new and changed scenario test to PR
When new scenario tests added or existing tests updated whe should add a sticky comment to the PR

```yml
name: scenario userlike (affected)

on:
  pull_request:

permissions:
  contents: read
  pull-requests: write

jobs:
  detect:
    name: detect changed scenarios
    runs-on: ubuntu-latest
    outputs:
      should_run: ${{ steps.filter.outputs.should_run }}
      files: ${{ steps.files.outputs.files }}
      files_md: ${{ steps.files.outputs.files_md }}

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      # Determine whether scenario-related files changed at all
      - name: Paths filter
        id: filter
        uses: dorny/paths-filter@v3
        with:
          filters: |
            should_run:
              - "tests/scenario/**/*.scenario.test.ts"
              - "tests/test-utils.ts"
              - "scripts/run-scenarios.mjs"
              - "vitest.scenario.config.ts"

      # Compute the affected scenario test files:
      # - If shared infra changed -> run ALL scenario tests
      # - Otherwise -> run only changed scenario test files
      - name: Compute affected files
        id: files
        if: steps.filter.outputs.should_run == 'true'
        shell: bash
        run: |
          set -euo pipefail

          BASE="${{ github.event.pull_request.base.sha }}"
          HEAD="${{ github.event.pull_request.head.sha }}"

          CHANGED="$(git diff --name-only "$BASE" "$HEAD")"

          echo "Changed files:"
          echo "$CHANGED"

          # If shared infra changed, run all scenarios
          if echo "$CHANGED" | grep -E -q '^(tests/test-utils\.ts|scripts/run-scenarios\.mjs|vitest\.scenario\.config\.ts)$'; then
            echo "Shared scenario infra changed -> run ALL scenario tests"
            ALL="$(git ls-files 'tests/scenario/**/*.scenario.test.ts')"
            printf "%s\n" "$ALL" > /tmp/scenario_files.txt
          else
            ONLY="$(echo "$CHANGED" | grep -E '^tests/scenario/.*\.scenario\.test\.ts$' || true)"
            printf "%s\n" "$ONLY" > /tmp/scenario_files.txt
          fi

          # If nothing to run, keep outputs empty
          if [ ! -s /tmp/scenario_files.txt ]; then
            echo "No scenario test files to run."
            echo "files=" >> $GITHUB_OUTPUT
            echo "files_md=" >> $GITHUB_OUTPUT
            exit 0
          fi

          echo "Affected scenario tests:"
          cat /tmp/scenario_files.txt

          FILES="$(cat /tmp/scenario_files.txt)"

          echo "files<<EOF" >> $GITHUB_OUTPUT
          echo "$FILES" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT

          echo "files_md<<EOF" >> $GITHUB_OUTPUT
          while IFS= read -r f; do
            [ -z "$f" ] && continue
            echo "- \`$f\`"
          done < /tmp/scenario_files.txt >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT

  run:
    name: scenario testing (userlike, affected only)
    runs-on: ubuntu-latest
    needs: detect
    if: needs.detect.outputs.should_run == 'true' && needs.detect.outputs.files != ''

    steps:
      - uses: actions/checkout@v4

      # Sticky comment early so users see status immediately
      - name: Sticky PR comment (in progress)
        uses: marocchino/sticky-pull-request-comment@v2
        with:
          header: scenario-testing
          message: |
            🟡 **scenario testing: in progress**

            **What this check does**
            This check runs **only scenario tests affected by this PR** in **user-like mode**:
            - tests are executed sequentially (no parallelism)
            - real user delays are enabled
            - videos are recorded for CLI and Web scenarios

            **Scenarios queued:**
            ${{ needs.detect.outputs.files_md }}

            **Workflow run:**
            https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      # Web: browsers + OS deps for Playwright
      - name: Install Playwright (with deps)
        run: npx playwright install --with-deps

      # CLI video tooling
      - name: Install asciinema + ffmpeg
        run: |
          sudo apt-get update
          sudo apt-get install -y asciinema ffmpeg

      # Optional: cast->gif conversion tool
      - name: Install Rust toolchain
        uses: dtolnay/rust-toolchain@stable

      - name: Install agg
        run: cargo install agg

      - name: Run affected scenarios in userlike mode
        env:
          SCENARIO_MODE: userlike
          # Runner must support this env var to restrict to these files
          SCENARIO_FILES: ${{ needs.detect.outputs.files }}
        run: node scripts/run-scenarios.mjs

      - name: Upload userlike artifacts (videos)
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: scenario-userlike-videos
          path: artifacts/user-style-e2e

      - name: Sticky PR comment (done)
        if: success()
        uses: marocchino/sticky-pull-request-comment@v2
        with:
          header: scenario-testing
          message: |
            🟢 **scenario testing: done**

            **What this check did**
            Successfully executed all **affected scenario tests** in **user-like mode**:
            - no parallel execution
            - human-like timing
            - video artifacts recorded

            **Scenarios executed:**
            ${{ needs.detect.outputs.files_md }}

            **Artifacts:**
            Download videos from the workflow artifacts:
            `scenario-userlike-videos`

            **Workflow run:**
            https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}

      - name: Sticky PR comment (fail)
        if: failure()
        uses: marocchino/sticky-pull-request-comment@v2
        with:
          header: scenario-testing
          message: |
            🔴 **scenario testing: fail**

            **What this check was doing**
            This check runs **affected scenario tests** in **user-like mode**
            to validate real user flows and record videos for review.

            One or more scenario tests failed.

            **Scenarios attempted:**
            ${{ needs.detect.outputs.files_md }}

            **Next steps**
            - Open the workflow run to inspect logs
            - Download video artifacts to see the failure

            **Workflow run:**
            https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}

```
