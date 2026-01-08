import { z } from "zod";

import type { ChatsApiContext } from "../apis/chats-api.js";
import { ShortcutsApi } from "../apis/shortcuts-api.js";
import type { WorkbenchContext } from "../workbench-light.js";
import { module, query } from "../workbench-light.js";

export type ShortcutsModuleContext = WorkbenchContext & ChatsApiContext;

export const shortcuts = module((ctx: ShortcutsModuleContext) => {
  const impl = new ShortcutsApi(ctx);

  return {
    api: {
      ask: query(
        z.object({ prompt: z.string(), providerId: z.string().optional(), timeoutMs: z.string().optional() }),
        z.string(),
        async ({ prompt, providerId, timeoutMs }) => {
          return await impl.ask(prompt, providerId, timeoutMs);
        },
        {
          id: "ask",
          pattern: "unary",
          args: [
            { name: "prompt", type: "string", required: true, cli: { positionalIndex: 0 } },
            { name: "providerId", type: "string", required: false, cli: { flag: "--provider" } },
            { name: "timeoutMs", type: "string", required: false, cli: { flag: "--timeout-ms" } }
          ]
        }
      ),

      prompt: query(
        z.object({ prompt: z.string(), providerId: z.string().optional(), timeoutMs: z.string().optional() }),
        z.object({
          text: z.string(),
          chatId: z.string(),
          providerId: z.string(),
          history: z.array(z.any())
        }),
        async ({ prompt, providerId, timeoutMs }) => {
          return await impl.prompt(prompt, providerId, timeoutMs);
        },
        {
          id: "prompt",
          pattern: "unary",
          args: [
            { name: "prompt", type: "string", required: true, cli: { positionalIndex: 0 } },
            { name: "providerId", type: "string", required: false, cli: { flag: "--provider" } },
            { name: "timeoutMs", type: "string", required: false, cli: { flag: "--timeout-ms" } }
          ]
        }
      )
    }
  };
});

