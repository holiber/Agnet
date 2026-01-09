# The prepeare-repo section

This section have policies that should be applied to repo before starting the works 

There is some packages should be installed after applying all the policies:

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


This is the look of project files and directories shold be in repo after applying all the policies:

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
