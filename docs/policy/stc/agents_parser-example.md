# Example of a parser for *.agent.md files

TODO: simplify and add tests
'''ts

/**
 * Agent .agent.md parser + validator (simplified)
 *
 * Changes per request:
 * - Added helper: getSectionAfterHeading()
 * - Tools:
 *   - We DO NOT parse JS in `## Tools` (too complex).
 *   - We only extract the JS code fence text and return it as `tools.code`.
 *   - The runtime will `eval` the code before agent starts; the code must return tool definitions.
 * - Startup tool existence is NOT statically validated here (runtime responsibility).
 *
 * Still enforced (throws):
 * - YAML keys are case-insensitive.
 * - YAML vs heading-derived conflicts for: title, description, avatar, system, rules
 *   (case-insensitive, trimmed).
 * - allow vs deny conflicts (optional extension) + ability validation (case-insensitive).
 */

import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { visit } from "unist-util-visit";
import type { Root, Paragraph, Image, Text, Heading, Content } from "mdast";

export type AgentStatus = "active" | "deprecated" | "disabled";

export type AgentRecommended = {
  models?: string[];
  capabilities?: string[];
};

export type AgentRequired = {
  env?: string[];
  startup?: string; // tool name to call after tools code eval
};

const BASE_ABILITIES = ["fs", "network", "sh", "tool", "mcp", "browser", "env"] as const;
type BaseAbility = (typeof BASE_ABILITIES)[number];
export type CanonicalAbility = `${BaseAbility}` | `sh:${string}`;

export type AgentDefinition = {
  version: string;
  icon: string;
  title: string;
  description: string;
  status: AgentStatus;

  recommended: AgentRecommended;
  required: AgentRequired;

  // Resolved from headings/defaults
  system: string;
  rules: string;
  avatar?: string;

  // Tools code is extracted but NOT parsed
  tools?: {
    code: string; // JS code from ## Tools fenced block
    language: "js" | "javascript";
    runtime_validation_required: boolean; // always true when required.startup is set
  };

  // optional extension (only if present in YAML)
  allow?: "*" | CanonicalAbility[];
  deny?: CanonicalAbility[];
};

class AgentParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AgentParseError";
  }
}

function normStr(v: unknown): string {
  return String(v ?? "").trim();
}
function normCmp(v: unknown): string {
  return normStr(v).toLowerCase();
}

/** Lower-case object keys (shallow), preserving values. */
function lowerKeys(obj: any): Record<string, any> {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return {};
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) out[String(k).toLowerCase()] = v;
  return out;
}

function mdText(node: any): string {
  if (!node) return "";
  if (node.type === "text") return (node as Text).value;
  if (node.type === "paragraph") return (node as Paragraph).children.map(mdText).join("");
  if (Array.isArray(node.children)) return node.children.map(mdText).join("");
  return "";
}

function stringifyNode(node: any): string {
  if (!node) return "";
  if (node.type === "paragraph") return mdText(node as Paragraph).trim();
  if (node.type === "heading") {
    const h = node as Heading;
    return `${"#".repeat(h.depth)} ${h.children.map(mdText).join("").trim()}`;
  }
  if (node.type === "list") {
    return (node.children ?? [])
      .map((li: any) => {
        const line = (li.children ?? []).map((c: any) => stringifyNode(c)).join(" ").trim();
        return `- ${line}`;
      })
      .join("\n");
  }
  if (Array.isArray(node.children)) return node.children.map(stringifyNode).join("\n").trim();
  return "";
}

/**
 * Returns the markdown text content after a heading until the next heading with depth <= headingDepth.
 * Heading matching is case-insensitive.
 *
 * NOTE: This returns a stringified markdown-ish representation (good enough for system/rules/tools extraction).
 */
function getSectionAfterHeading(ast: Root, headingText: string, headingDepth: number): string | undefined {
  const nodes = ast.children;
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (n.type !== "heading") continue;

    const h = n as Heading;
    const t = h.children.map(mdText).join("").trim();

    if (h.depth === headingDepth && t.toLowerCase() === headingText.toLowerCase()) {
      const parts: string[] = [];
      for (let j = i + 1; j < nodes.length; j++) {
        const m = nodes[j];
        if (m.type === "heading") {
          const hh = m as Heading;
          if (hh.depth <= headingDepth) break;
        }
        parts.push(stringifyNode(m));
      }
      const out = parts.join("\n").trim();
      return out.length ? out : undefined;
    }
  }
  return undefined;
}

function findFirstImageInSection(ast: Root, headingText: string, headingDepth: number): string | undefined {
  const nodes = ast.children;
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (n.type !== "heading") continue;

    const h = n as Heading;
    const t = h.children.map(mdText).join("").trim();

    if (h.depth === headingDepth && t.toLowerCase() === headingText.toLowerCase()) {
      for (let j = i + 1; j < nodes.length; j++) {
        const m = nodes[j];
        if (m.type === "heading") {
          const hh = m as Heading;
          if (hh.depth <= headingDepth) break;
        }
        let found: string | undefined;
        visit(m, "image", (img: Image) => {
          if (!found) found = img.url;
        });
        if (found) return found;
      }
    }
  }
  return undefined;
}

function extractFirstJsFence(sectionText: string): { lang: "js" | "javascript"; code: string } | undefined {
  const re = /```(js|javascript)\s*\n([\s\S]*?)\n```/i;
  const m = re.exec(sectionText);
  if (!m?.[1] || !m?.[2]) return undefined;
  const lang = m[1].toLowerCase() as "js" | "javascript";
  return { lang, code: m[2].trim() };
}

type Extracted = {
  firstH1Title?: string;
  firstParagraphAfterH1?: string;
  avatarFromAvatarSection?: string;
  avatarFromBodyStart?: string;
  systemSection?: string;
  rulesSection?: string;
  toolsFence?: { lang: "js" | "javascript"; code: string };
};

function extractFromMarkdown(body: string): Extracted {
  const ast = unified().use(remarkParse).parse(body) as Root;
  const extracted: Extracted = {};

  // First H1 title + first paragraph after it
  let sawFirstH1 = false;
  let afterFirstH1 = false;

  for (let i = 0; i < ast.children.length; i++) {
    const n = ast.children[i];

    if (n.type === "heading") {
      const h = n as Heading;
      const t = h.children.map(mdText).join("").trim();

      if (!sawFirstH1 && h.depth === 1) {
        extracted.firstH1Title = t || undefined;
        sawFirstH1 = true;
        afterFirstH1 = true;
        continue;
      }
      if (afterFirstH1 && h.depth >= 1) afterFirstH1 = false;
    }

    if (afterFirstH1 && !extracted.firstParagraphAfterH1 && n.type === "paragraph") {
      const txt = mdText(n as Paragraph).trim();
      if (txt) extracted.firstParagraphAfterH1 = txt;
      continue;
    }

    // Avatar from body start: first image before first H1
    if (!sawFirstH1 && !extracted.avatarFromBodyStart) {
      let found: string | undefined;
      visit(n as Content, "image", (img: Image) => {
        if (!found) found = img.url;
      });
      if (found) extracted.avatarFromBodyStart = found;
    }
  }

  extracted.avatarFromAvatarSection = findFirstImageInSection(ast, "Avatar", 1);
  extracted.systemSection = getSectionAfterHeading(ast, "System", 2);
  extracted.rulesSection = getSectionAfterHeading(ast, "Rules", 2);

  const toolsSection = getSectionAfterHeading(ast, "Tools", 2);
  if (toolsSection) {
    const fence = extractFirstJsFence(toolsSection);
    if (fence) extracted.toolsFence = fence;
  }

  return extracted;
}

function assertNoYamlHeadingConflicts(params: { yamlValue?: string; inferredValue?: string; keyName: string }) {
  const { yamlValue, inferredValue, keyName } = params;
  if (!yamlValue || !inferredValue) return;
  if (normCmp(yamlValue) !== normCmp(inferredValue)) {
    throw new AgentParseError(
      `Conflict for "${keyName}": YAML value "${normStr(yamlValue)}" differs from heading-derived value "${normStr(
        inferredValue
      )}".`
    );
  }
}

function normalizeStatus(v: unknown): AgentStatus {
  const s = normStr(v || "active").toLowerCase();
  if (s === "active" || s === "deprecated" || s === "disabled") return s;
  throw new AgentParseError(`Invalid status "${normStr(v)}". Allowed: active, deprecated, disabled.`);
}

function normalizeStringList(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map((x) => normStr(x)).filter(Boolean);
  return normStr(v)
    .split(/\r?\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Ability validation (optional extension) */
export function validateAndNormalizeAbilities(
  input: "*" | "" | false | string[] | string | undefined,
  fieldName: "allow" | "deny"
): "*" | CanonicalAbility[] {
  if (input === undefined) return fieldName === "allow" ? "*" : [];
  if (input === "*") return "*";
  if (input === "" || input === false) return [];

  const list = Array.isArray(input)
    ? input.map(String)
    : String(input)
        .split(/\r?\n|,/)
        .map((s) => s.trim())
        .filter(Boolean);

  const out: CanonicalAbility[] = [];
  for (const raw of list) {
    const v = raw.trim();
    if (!v) continue;

    if (v === "*") {
      throw new AgentParseError(`Invalid ability "*" inside ${fieldName} list. Use ${fieldName}: "*" as a scalar only.`);
    }

    const m = /^([a-z]+)(?::([a-z0-9._-]+))?$/i.exec(v);
    if (!m) throw new AgentParseError(`Invalid ability syntax in ${fieldName}: "${v}"`);

    const base = m[1].toLowerCase();
    const scope = m[2];

    if (!BASE_ABILITIES.includes(base as BaseAbility)) {
      throw new AgentParseError(
        `Unknown base ability in ${fieldName}: "${v}". Allowed: ${BASE_ABILITIES.join(", ")}`
      );
    }

    if (scope) {
      if (base !== "sh") {
        throw new AgentParseError(`Scoped ability is only allowed for "sh:<command>". Invalid: "${v}"`);
      }
      out.push(`sh:${scope.toLowerCase()}`);
    } else {
      out.push(base as CanonicalAbility);
    }
  }

  return Array.from(new Set(out));
}

function assertNoAllowDenyConflicts(allow: "*" | CanonicalAbility[], deny: CanonicalAbility[]) {
  if (allow === "*") return; // allow-all with deny-some is valid
  const allowSet = new Set(allow);
  const conflicts = deny.filter((d) => allowSet.has(d));
  if (conflicts.length) {
    throw new AgentParseError(`allow/deny conflict: abilities present in both allow and deny: ${conflicts.join(", ")}`);
  }
}

export function parseAgentMarkdown(fileContent: string): AgentDefinition {
  const parsed = matter(fileContent);

  // YAML keys are case-insensitive
  const fm = lowerKeys(parsed.data || {});

  // Nested keys in recommended/required should also be treated case-insensitively
  const recommendedRaw = lowerKeys(fm["recommended"] || {});
  const requiredRaw = lowerKeys(fm["required"] || {});

  const body = parsed.content ?? "";
  const extracted = extractFromMarkdown(body);

  // Conflicts: YAML vs heading-derived (case-insensitive)
  assertNoYamlHeadingConflicts({ keyName: "title", yamlValue: fm["title"], inferredValue: extracted.firstH1Title });
  assertNoYamlHeadingConflicts({
    keyName: "description",
    yamlValue: fm["description"],
    inferredValue: extracted.firstParagraphAfterH1,
  });
  assertNoYamlHeadingConflicts({
    keyName: "avatar",
    yamlValue: fm["avatar"],
    inferredValue: extracted.avatarFromAvatarSection ?? extracted.avatarFromBodyStart,
  });
  assertNoYamlHeadingConflicts({ keyName: "system", yamlValue: fm["system"], inferredValue: extracted.systemSection });
  assertNoYamlHeadingConflicts({ keyName: "rules", yamlValue: fm["rules"], inferredValue: extracted.rulesSection });

  const version = normStr(fm["version"]) || "0.1.0";
  const icon = normStr(fm["icon"]) || "🤖";
  const status = normalizeStatus(fm["status"]);

  const title = normStr(fm["title"]) || normStr(extracted.firstH1Title) || "Untitled Agent";
  const description = normStr(fm["description"]) || normStr(extracted.firstParagraphAfterH1) || "";

  const avatar =
    normStr(fm["avatar"]) ||
    normStr(extracted.avatarFromAvatarSection) ||
    normStr(extracted.avatarFromBodyStart) ||
    undefined;

  const rules = normStr(fm["rules"]) || normStr(extracted.rulesSection) || "";

  // System message resolution per policy:
  // 1) content under ## System
  // 2) description (resolved)
  // 3) title
  const system = normStr(extracted.systemSection) || description || title;

  const recommended: AgentRecommended = {
    models: Array.isArray(recommendedRaw["models"]) ? recommendedRaw["models"].map(normStr).filter(Boolean) : undefined,
    capabilities: Array.isArray(recommendedRaw["capabilities"])
      ? recommendedRaw["capabilities"].map(normStr).filter(Boolean)
      : undefined,
  };

  const required: AgentRequired = {
    env: normalizeStringList(requiredRaw["env"]),
    startup: normStr(requiredRaw["startup"]) || undefined,
  };

  // Tools: extract JS fence under ## Tools (no parsing)
  let tools: AgentDefinition["tools"] | undefined;
  if (extracted.toolsFence) {
    tools = {
      code: extracted.toolsFence.code,
      language: extracted.toolsFence.lang,
      runtime_validation_required: Boolean(required.startup),
    };
  } else if (required.startup) {
    // required.startup implies Tools should exist; keep this strict.
    throw new AgentParseError(`required.startup is set to "${required.startup}" but no "## Tools" JS code fence was found.`);
  }

  // Optional extension: allow/deny if present in YAML (keys case-insensitive)
  const hasAllow = "allow" in fm;
  const hasDeny = "deny" in fm;
  let allow: "*" | CanonicalAbility[] | undefined;
  let deny: CanonicalAbility[] | undefined;

  if (hasAllow || hasDeny) {
    const allowNorm = validateAndNormalizeAbilities(fm["allow"], "allow");
    const denyNorm = validateAndNormalizeAbilities(fm["deny"], "deny");
    if (denyNorm === "*") {
      throw new AgentParseError(`deny: "*" is not allowed.`);
    }
    assertNoAllowDenyConflicts(allowNorm, denyNorm as CanonicalAbility[]);
    allow = allowNorm;
    deny = denyNorm as CanonicalAbility[];
  }

  return {
    version,
    icon,
    title,
    description,
    status,
    recommended,
    required,
    system,
    rules,
    avatar,
    ...(tools ? { tools } : {}),
    ...(allow !== undefined ? { allow } : {}),
    ...(deny !== undefined ? { deny } : {}),
  };
}

// Example CLI usage:
//   node parse-agent.js agents/policies_policy-auditor.agent.md
if (require.main === module) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require("node:fs");
  const path = process.argv[2];
  if (!path) {
    console.error("Usage: node parse-agent.js <path-to-agent-file>");
    process.exit(1);
  }
  const content = fs.readFileSync(path, "utf8");
  const agent = parseAgentMarkdown(content);
  console.log(JSON.stringify(agent, null, 2));
}

'''
