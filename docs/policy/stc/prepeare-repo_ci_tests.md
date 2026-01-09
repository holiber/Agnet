## Setup test runs on CI
There should be parallel checks setup in CI

test unit (npm run test:unit)
test e2e (npm run test:e2e)
test smoke (npm run test:scenario:smoke)

## Github Config example

```yml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test_unit:
    name: test unit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      # setup-node supports built-in npm cache via `cache: npm`. :contentReference[oaicite:0]{index=0}

      - name: Install deps
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

  test_e2e:
    name: test e2e
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install deps
        run: npm ci

      # If your regular e2e tests use Playwright, uncomment this:
      # - name: Install Playwright browsers + OS deps
      #   run: npx playwright install --with-deps
      # Playwright recommends installing browsers/deps in CI. :contentReference[oaicite:1]{index=1}

      - name: Run e2e tests
        run: npm run test:e2e

  test_smoke:
    name: test smoke
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install deps
        run: npm ci

      - name: Run scenario smokecheck
        run: npm run test:scenario:smoke

      # Upload smoke logs ONLY if the job failed
      - name: Upload smoke logs
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: smokecheck-logs
          path: .cache/smokecheck
      # actions/upload-artifact v4 is the supported version. :contentReference[oaicite:2]{index=2}


```
