import { describe, expect, it } from "vitest";

import { nextMessage } from "../src/runtime/chat-client.js";

describe("timeouts", () => {
  it("nextMessage rejects on timeout instead of throwing in the background", async () => {
    const iter: AsyncIterator<unknown> = {
      next: () => new Promise<IteratorResult<unknown>>(() => {})
    };

    await expect(nextMessage(iter, "never", 10)).rejects.toThrow(/Timeout/i);
  });
});

