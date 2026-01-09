# Это политика для разворачивания нового репозитория или для адаптирования уже существующего репозитория


| Package      | Required             | Why                     |
| ------------ | -------------------- | ----------------------- |
| `vitest`     | ✅                    | Test runner             |
| `playwright` | ✅ (if web scenarios) | Web automation + video  |
| `node-pty`   | ✅ (if CLI scenarios) | Real terminal behavior  |
| `cross-env`  | ⚠️        | Cross-platform env vars |
| `typescript` | ✅ (if TS)            | TypeScript support      |

| Tool                | Required          | Why                      |
| ------------------- | ----------------- | ------------------------ |
| `asciinema`         | ✅ (CLI user-like) | Terminal video recording |
| `agg`               | ⚠️     | cast → gif               |
| `ffmpeg`            | ⚠️     | gif → mp4                |
| Playwright browsers | ✅ (web)           | Chromium/WebKit/Firefox  |





```json
{
  "scripts": {
    // Base tests (NO scenarios)
    "test": "npm run test:unit && npm run test:e2e",

    "test:unit": "vitest run \"tests/unit/**/*.test.ts\"",

    "test:e2e": "vitest run \"tests/e2e/**/*.e2e.test.ts\"",

    // Scenario tests (separate)

    "test:scenario:smoke": "cross-env SCENARIO_MODE=smoke node scripts/run-scenarios.mjs",

    "test:scenario:userlike": "cross-env SCENARIO_MODE=userlike node scripts/run-scenarios.mjs",

    "test:scenario:userlike:web": "cross-env SCENARIO_MODE=userlike node scripts/run-scenarios.mjs --web",

    "test:scenario:userlike:web:mobile": "cross-env SCENARIO_MODE=userlike node scripts/run-scenarios.mjs --web --mobile"
  }
}
```


## Файлы репозитория
<pre>
.
├── .gitignore
├── tsconfig.json
├── package.json
│
├── .cache/
│   └── smokecheck/
│       └── *.log
│
├── artifacts/
│   └── user-style-e2e/
│       ├── cli/
│       │   └── <scenario-name>/
│       │       ├── <scenario-name>.cast
│       │       ├── <scenario-name>.gif
│       │       └── <scenario-name>.mp4
│       │
│       └── web/
│           └── <scenario-name>/
│               └── video.webm
│
├── scripts/
│   └── run-scenarios.mjs
│
├── tests/
│   ├── test-utils.ts
│   │
│   ├── unit/
│   │   └── *.test.ts
│   │
│   ├── e2e/
│   │   └── *.e2e.test.ts
│   │
│   └── scenario/
│       ├── cli/
│       │   └── *.scenario.test.ts
│       │
│       └── web/
│           └── *.scenario.test.ts
│
├── docs/
│   ├── generated/
│   │   └── README.generated.md
│   │
│   ├── research/
│   │   └── *.md
│   │
│   ├── policy/
│   │   ├── testing.md
│   │   ├── ci.md
│   │   └── agent-behavior.md
│   │
│   └── TESTING.md
│
├── CONTRIBUTING.md
├── AGENT.md
│
├── vitest.config.ts
├── vitest.scenario.config.ts
│
└── .github/
    └── workflows/
</pre>
