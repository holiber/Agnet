import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { createInterface } from "node:readline/promises";

import { createApp, createAppContext } from "../app.js";
import { flattenApiSchema } from "../internal/api-schema.js";
import { toErrorMessage } from "../internal/utils.js";
import { tokenizeCommandLine } from "./command-line.js";
import { runTui } from "./tui.js";

function endpointPathTokens(endpointId: string): string[] {
  return endpointId.split(".").filter(Boolean);
}

type CliEndpoint = ReturnType<typeof flattenApiSchema>[number];
type OutputFormat = "text" | "json";

function usage(endpoints: CliEndpoint[]): string {
  const lines: string[] = [];
  lines.push("Agnet CLI", "");
  lines.push("Usage:");
  lines.push("  agnet tui [--mode <simple|advanced>] [--provider <providerId>] [--chat <chatId>]");
  for (const ep of endpoints) {
    const path = ["agnet", ...endpointPathTokens(ep.id)].join(" ");
    const args = ep.args
      .map((a) => {
        const flag = a.cli?.flag;
        const pos = a.cli?.positionalIndex;
        if (pos !== undefined) return `<${a.name}>`;
        if (flag) return a.required ? `${flag} <${a.name}>` : `[${flag} <${a.name}>]`;
        return "";
      })
      .filter(Boolean)
      .join(" ");
    lines.push(`  ${path}${args ? " " + args : ""}`);
  }
  lines.push(
    "",
    "Global options:",
    "  --interactive, -i  Start interactive mode",
    "  --output <format>  Output format: text (default) or json",
    "",
    "Notes:",
    '  - Use "--help" for this message.'
  );
  return lines.join("\n");
}

function tuiUsage(): string {
  return [
    "Agnet TUI",
    "",
    "Usage:",
    "  agnet tui [--mode <simple|advanced>] [--provider <providerId>] [--chat <chatId>]",
    "",
    "Notes:",
    "  - Advanced mode is default.",
    "  - TUI requires an interactive TTY.",
    ""
  ].join("\n");
}

type ParsedFlags = Record<string, string | boolean | string[]>;

function setFlag(flags: ParsedFlags, key: string, value: string | boolean): void {
  const existing = flags[key];
  if (existing === undefined) {
    flags[key] = value;
    return;
  }
  if (Array.isArray(existing)) {
    existing.push(String(value));
    return;
  }
  flags[key] = [String(existing), String(value)];
}

function parseCliFlags(tokens: string[]): { flags: ParsedFlags; positional: string[] } {
  const positional: string[] = [];
  const flags: ParsedFlags = {};

  for (let i = 0; i < tokens.length; i++) {
    const a = tokens[i];
    if (a === "--") break;
    if (!a.startsWith("--")) {
      positional.push(a);
      continue;
    }

    const eq = a.indexOf("=");
    if (eq !== -1) {
      const k = a.slice(2, eq);
      const v = a.slice(eq + 1);
      setFlag(flags, k, v);
      continue;
    }

    const k = a.slice(2);
    const next = tokens[i + 1];
    if (next && !next.startsWith("--")) {
      setFlag(flags, k, next);
      i++;
    } else {
      setFlag(flags, k, true);
    }
  }

  return { flags, positional };
}

function coerceBoolean(value: unknown, label: string): boolean {
  if (value === true) return true;
  if (value === false) return false;
  if (typeof value === "string") {
    const v = value.toLowerCase();
    if (v === "true" || v === "1") return true;
    if (v === "false" || v === "0") return false;
  }
  throw new Error(`Invalid ${label}: expected boolean`);
}

function coerceString(value: unknown, label: string): string {
  if (typeof value === "string") return value;
  throw new Error(`Invalid ${label}: expected string`);
}

function coerceStringArray(value: unknown, label: string): string[] {
  if (value === undefined) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.map((v) => coerceString(v, label));
  throw new Error(`Invalid ${label}: expected string[]`);
}

function argKeyFromFlag(flag: string): string {
  return flag.startsWith("--") ? flag.slice(2) : flag;
}

function parseEndpointInput(params: {
  endpoint: CliEndpoint;
  argvAfterCommand: string[];
}): unknown {
  const firstFlagIdx = params.argvAfterCommand.findIndex((t) => t.startsWith("--"));
  const commandTail =
    firstFlagIdx === -1 ? params.argvAfterCommand : params.argvAfterCommand.slice(0, firstFlagIdx);
  const flagsTail = firstFlagIdx === -1 ? [] : params.argvAfterCommand.slice(firstFlagIdx);
  const { flags, positional } = parseCliFlags(flagsTail);

  // Positionals are taken from the non-flag tail (for backwards compatibility).
  const allPositional = [...commandTail, ...positional];

  // Build a lookup for known flags to their arg meta.
  const byFlag = new Map<string, CliEndpoint["args"][number]>();
  for (const arg of params.endpoint.args) {
    if (arg.cli?.flag) byFlag.set(argKeyFromFlag(arg.cli.flag), arg);
    for (const alias of arg.cli?.aliases ?? []) byFlag.set(argKeyFromFlag(alias), arg);
  }

  // Special-case: support `--files a b` (consume until next flag) for string[] repeatable flags.
  const expandedFlags: ParsedFlags = {};
  for (let i = 0; i < flagsTail.length; i++) {
    const tok = flagsTail[i];
    if (!tok.startsWith("--")) continue;
    const eq = tok.indexOf("=");
    const rawKey = eq === -1 ? tok : tok.slice(0, eq);
    const key = argKeyFromFlag(rawKey);
    const meta = byFlag.get(key);
    if (!meta || meta.type !== "string[]" || !meta.cli?.repeatable) continue;
    if (eq !== -1) {
      setFlag(expandedFlags, key, tok.slice(eq + 1));
      continue;
    }

    const next = flagsTail[i + 1];
    if (!next || next.startsWith("--")) {
      // Keep behavior close to the legacy CLI: mark present.
      setFlag(expandedFlags, key, true);
      continue;
    }

    // Consume all subsequent non-flag tokens.
    let consumed = 0;
    for (let j = i + 1; j < flagsTail.length; j++) {
      const v = flagsTail[j];
      if (!v || v.startsWith("--")) break;
      setFlag(expandedFlags, key, v);
      consumed++;
    }
    i += consumed;
  }

  // Merge: expanded flags override base flags for repeatable collection.
  const mergedFlags: ParsedFlags = { ...flags, ...expandedFlags };

  // Validate unknown flags early (to keep CLI strict and predictable).
  for (const k of Object.keys(mergedFlags)) {
    if (!byFlag.has(k)) throw new Error(`Unknown flag: --${k}`);
  }

  const out: Record<string, unknown> = {};

  for (const arg of params.endpoint.args) {
    let raw: unknown = undefined;

    // 1) positional binding
    if (arg.cli?.positionalIndex !== undefined) {
      raw = allPositional[arg.cli.positionalIndex];
    }

    // 2) flag binding (overrides positional if provided)
    const flagKey = arg.cli?.flag ? argKeyFromFlag(arg.cli.flag) : undefined;
    if (flagKey && mergedFlags[flagKey] !== undefined) raw = mergedFlags[flagKey];
    for (const alias of arg.cli?.aliases ?? []) {
      const k = argKeyFromFlag(alias);
      if (mergedFlags[k] !== undefined) raw = mergedFlags[k];
    }

    if (raw === undefined) {
      if (arg.required) {
        const hint = arg.cli?.flag ? ` (${arg.cli.flag})` : "";
        throw new Error(`Missing required argument: ${arg.name}${hint}`);
      }
      continue;
    }

    if (arg.type === "boolean") out[arg.name] = coerceBoolean(raw, arg.name);
    else if (arg.type === "string") {
      if (raw === true) throw new Error(`Missing value for ${arg.cli?.flag ?? arg.name}`);
      out[arg.name] = coerceString(raw, arg.name);
    } else if (arg.type === "string[]") {
      if (raw === true) out[arg.name] = [];
      else out[arg.name] = coerceStringArray(raw, arg.name);
    } else {
      // Exhaustiveness.
      out[arg.name] = raw;
    }
  }

  return Object.keys(out).length > 0 ? out : undefined;
}

function selectEndpoint(endpoints: CliEndpoint[], argvTokens: string[]): { endpoint: CliEndpoint; pathLen: number } | undefined {
  const commandTokens: string[] = [];
  for (const t of argvTokens) {
    if (t.startsWith("--")) break;
    commandTokens.push(t);
  }

  let best: { endpoint: CliEndpoint; pathLen: number } | undefined;
  for (const ep of endpoints) {
    const p = endpointPathTokens(ep.id);
    if (p.length === 0) continue;
    if (p.length > commandTokens.length) continue;
    const matches = p.every((seg, i) => commandTokens[i] === seg);
    if (!matches) continue;
    if (!best || p.length > best.pathLen) best = { endpoint: ep, pathLen: p.length };
  }
  return best;
}

function printUnary(result: unknown): void {
  if (typeof result === "string") {
    process.stdout.write(result.endsWith("\n") ? result : result + "\n");
    return;
  }
  if (result === undefined) return;
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

async function printStream(iterable: AsyncIterable<unknown>): Promise<void> {
  for await (const chunk of iterable) {
    if (typeof chunk === "string") {
      process.stdout.write(chunk);
    } else if (chunk !== undefined) {
      process.stdout.write(JSON.stringify(chunk) + "\n");
    }
  }
}

function printUnaryFormatted(result: unknown, output: OutputFormat): void {
  if (output === "json") {
    process.stdout.write(JSON.stringify({ ok: true, result }, null, 2) + "\n");
    return;
  }
  printUnary(result);
}

async function printStreamFormatted(iterable: AsyncIterable<unknown>, output: OutputFormat): Promise<void> {
  if (output === "text") {
    await printStream(iterable);
    return;
  }

  let combined = "";
  const nonString: unknown[] = [];
  for await (const chunk of iterable) {
    if (typeof chunk === "string") combined += chunk;
    else if (chunk !== undefined) nonString.push(chunk);
  }

  const result = nonString.length > 0 ? { text: combined, chunks: nonString } : combined;
  process.stdout.write(JSON.stringify({ ok: true, result }, null, 2) + "\n");
}

function getByPath(obj: any, pathTokens: string[]): unknown {
  let cur: any = obj;
  for (const k of pathTokens) cur = cur?.[k];
  return cur;
}

async function runTuiCommand(params: {
  ctx: ReturnType<typeof createAppContext>;
  tail: string[];
}): Promise<void> {
  if (params.tail.includes("--help") || params.tail.includes("-h")) {
    process.stdout.write(tuiUsage());
    return;
  }

  const { flags } = parseCliFlags(params.tail);
  for (const k of Object.keys(flags)) {
    if (k !== "mode" && k !== "provider" && k !== "chat") {
      throw new Error(`Unknown flag for tui: --${k}`);
    }
  }

  const modeRaw = flags.mode;
  const mode =
    modeRaw === undefined
      ? undefined
      : modeRaw === true
        ? (() => {
            throw new Error("Missing value for --mode");
          })()
        : coerceString(modeRaw, "mode");
  if (mode !== undefined && mode !== "simple" && mode !== "advanced") {
    throw new Error('Invalid mode: expected "simple" or "advanced"');
  }

  const providerIdRaw = flags.provider;
  const providerId =
    providerIdRaw === undefined
      ? undefined
      : providerIdRaw === true
        ? (() => {
            throw new Error("Missing value for --provider");
          })()
        : coerceString(providerIdRaw, "provider");

  const chatIdRaw = flags.chat;
  const chatId =
    chatIdRaw === undefined
      ? undefined
      : chatIdRaw === true
        ? (() => {
            throw new Error("Missing value for --chat");
          })()
        : coerceString(chatIdRaw, "chat");

  await runTui(params.ctx as any, { mode: mode as any, providerId, chatId });
}

async function dispatchOnce(params: {
  app: unknown;
  endpoints: CliEndpoint[];
  publicEndpoints: CliEndpoint[];
  tokens: string[];
  strictExitCode: boolean;
  output: OutputFormat;
}): Promise<void> {
  if (params.tokens.length === 0 || params.tokens.includes("--help") || params.tokens.includes("-h")) {
    process.stdout.write(usage(params.publicEndpoints) + "\n");
    return;
  }

  const selected = selectEndpoint(params.endpoints, params.tokens);
  if (!selected) {
    process.stderr.write(usage(params.publicEndpoints) + "\n");
    if (params.strictExitCode) process.exitCode = 1;
    return;
  }

  const argvAfterCommand = params.tokens.slice(selected.pathLen);

  try {
    const input = parseEndpointInput({ endpoint: selected.endpoint, argvAfterCommand });
    const fn = getByPath(params.app as any, selected.endpoint.callPath);
    if (typeof fn !== "function") {
      throw new Error(`Handler method not found for endpoint "${selected.endpoint.id}"`);
    }

    const res = (fn as (i: unknown) => unknown)(input);
    if (selected.endpoint.pattern === "serverStream" || selected.endpoint.kind === "stream") {
      await printStreamFormatted(res as AsyncIterable<unknown>, params.output);
    } else {
      printUnaryFormatted(await Promise.resolve(res), params.output);
    }
  } catch (err) {
    process.stderr.write(toErrorMessage(err) + "\n");
    if (params.strictExitCode) process.exitCode = 1;
  }
}

function parseOutputFormat(rawTokens: string[]): { output: OutputFormat; tokens: string[] } {
  let output: OutputFormat = "text";
  const tokens = [...rawTokens];

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (!t) continue;

    if (t === "--output") {
      const v = tokens[i + 1];
      if (!v || v.startsWith("--")) throw new Error("Missing value for --output");
      if (v !== "text" && v !== "json") throw new Error('Invalid --output: expected "text" or "json"');
      output = v;
      tokens.splice(i, 2);
      i--;
      continue;
    }

    if (t.startsWith("--output=")) {
      const v = t.slice("--output=".length);
      if (v !== "text" && v !== "json") throw new Error('Invalid --output: expected "text" or "json"');
      output = v;
      tokens.splice(i, 1);
      i--;
      continue;
    }
  }

  return { output, tokens };
}

async function runInteractive(params: {
  app: unknown;
  endpoints: CliEndpoint[];
  publicEndpoints: CliEndpoint[];
  initialTokens?: string[];
  output: OutputFormat;
}): Promise<void> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
  });

  process.stdout.write('Agnet interactive mode. Type "help" (or "?") for commands, "exit" to quit.\n');

  try {
    if (params.initialTokens && params.initialTokens.length > 0) {
      await dispatchOnce({
        app: params.app,
        endpoints: params.endpoints,
        publicEndpoints: params.publicEndpoints,
        tokens: params.initialTokens,
        strictExitCode: false,
        output: params.output
      });
    }

    // eslint-disable-next-line no-constant-condition
    while (true) {
      let line: string;
      try {
        line = await rl.question("agnet> ");
      } catch {
        break; // stdin closed
      }

      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed === "exit" || trimmed === "quit") break;
      if (trimmed === "help" || trimmed === "?") {
        process.stdout.write(usage(params.publicEndpoints) + "\n");
        continue;
      }

      let tokens = tokenizeCommandLine(trimmed);
      if (tokens[0] === "agnet") tokens = tokens.slice(1);

      await dispatchOnce({
        app: params.app,
        endpoints: params.endpoints,
        publicEndpoints: params.publicEndpoints,
        tokens,
        strictExitCode: false,
        output: params.output
      });
    }
  } finally {
    rl.close();
  }
}

export async function runCli(argv: string[]): Promise<void> {
  const entryPath = argv[1];
  const mockAgentPathCandidate =
    typeof entryPath === "string" && entryPath.length > 0 ? path.resolve(path.dirname(entryPath), "mock-agent.mjs") : "";
  const mockAgentPath = existsSync(mockAgentPathCandidate)
    ? mockAgentPathCandidate
    : path.resolve(process.cwd(), "bin", "mock-agent.mjs");

  const ctx = createAppContext({ cwd: process.cwd(), env: process.env, mockAgentPath });
  const app = createApp(ctx);
  const endpoints = flattenApiSchema(app.getApiSchema());
  const publicEndpoints = endpoints.filter((e) => !e.internal);

  const rawTokens = argv.slice(2);
  const interactive = rawTokens.includes("--interactive") || rawTokens.includes("-i");
  const tokensWithoutInteractive = rawTokens.filter((t) => t !== "--interactive" && t !== "-i");

  let output: OutputFormat = "text";
  let tokens: string[] = tokensWithoutInteractive;
  try {
    const parsed = parseOutputFormat(tokensWithoutInteractive);
    output = parsed.output;
    tokens = parsed.tokens;
  } catch (err) {
    process.stderr.write(toErrorMessage(err) + "\n");
    process.exitCode = 1;
    return;
  }

  if (tokens[0] === "tui") {
    try {
      await runTuiCommand({ ctx, tail: tokens.slice(1) });
    } catch (err) {
      process.stderr.write(toErrorMessage(err) + "\n");
      process.exitCode = 1;
    }
    return;
  }

  if (interactive) {
    await runInteractive({ app, endpoints, publicEndpoints, initialTokens: tokens.length > 0 ? tokens : undefined, output });
    return;
  }

  await dispatchOnce({ app, endpoints, publicEndpoints, tokens, strictExitCode: true, output });
}

