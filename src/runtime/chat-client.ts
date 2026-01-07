import type {
  AgentToClientMessage,
  SessionCompleteMessage,
  SessionStreamMessage
} from "../protocol.js";
import type { StdioJsonTransport } from "../stdio-transport.js";

/**
 * Global fallback timeout for waiting on AI/agent responses.
 * This is intentionally longer than control-plane waits (e.g. "ready").
 */
export const GLOBAL_FALLBACK_AI_TIMEOUT_MS = 60_000;

const DEFAULT_CONTROL_PLANE_TIMEOUT_MS = 2_000;

export function randomId(
  prefix: string,
  nowMs = Date.now(),
  randomHex = Math.random().toString(16).slice(2, 10)
): string {
  return `${prefix}-${nowMs}-${randomHex}`;
}

export async function nextMessage(
  iter: AsyncIterator<unknown>,
  label: string,
  timeoutMs = DEFAULT_CONTROL_PLANE_TIMEOUT_MS
): Promise<unknown> {
  const res = await withTimeout(iter.next(), timeoutMs, `waiting for ${label}`);
  if (res.done) throw new Error(`Unexpected end of stream while waiting for ${label}`);
  return res.value;
}

export async function waitForType<T extends AgentToClientMessage["type"]>(
  iter: AsyncIterator<unknown>,
  type: T
): Promise<Extract<AgentToClientMessage, { type: T }>> {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const msg = await nextMessage(iter, `message type "${type}"`);
    if (msg && typeof msg === "object" && (msg as { type?: unknown }).type === type) {
      return msg as Extract<AgentToClientMessage, { type: T }>;
    }
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1) {
    throw new Error(`Invalid timeoutMs (${timeoutMs}) for ${label}`);
  }
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      const t = setTimeout(() => reject(new Error(`Timeout ${label}`)), timeoutMs);
      // Avoid keeping the event loop alive on Node versions that support it.
      (t as unknown as { unref?: () => void }).unref?.();
    })
  ]);
}

export async function sendAndWaitComplete(params: {
  iter: AsyncIterator<unknown>;
  transport: StdioJsonTransport;
  sessionId: string;
  content: string;
  onDelta?: (delta: string) => void;
  /**
   * Timeout (ms) for waiting on streamed deltas / completion from the agent.
   * Falls back to the global default if omitted.
   */
  timeoutMs?: number;
}): Promise<{ msg: SessionCompleteMessage; combined: string }> {
  await params.transport.send({
    type: "session/send",
    sessionId: params.sessionId,
    content: params.content
  });

  const timeoutMs = params.timeoutMs ?? GLOBAL_FALLBACK_AI_TIMEOUT_MS;
  const deltasByIndex = new Map<number, string>();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const msg = await nextMessage(
      params.iter,
      `stream/complete for session "${params.sessionId}"`,
      timeoutMs
    );
    if (!msg || typeof msg !== "object") continue;

    const type = (msg as { type?: unknown }).type;
    if (type === "session/stream" && (msg as SessionStreamMessage).sessionId === params.sessionId) {
      const stream = msg as SessionStreamMessage;
      const idx = typeof stream.index === "number" ? stream.index : deltasByIndex.size;
      const delta = typeof stream.delta === "string" ? stream.delta : "";
      deltasByIndex.set(idx, delta);
      params.onDelta?.(delta);
      continue;
    }

    if (type === "session/complete" && (msg as SessionCompleteMessage).sessionId === params.sessionId) {
      const complete = msg as SessionCompleteMessage;
      const combined = [...deltasByIndex.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([, d]) => d)
        .join("");
      return { msg: complete, combined };
    }
  }
}

