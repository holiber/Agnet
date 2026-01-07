import { z } from "zod";

import type { ChatsApiContext } from "../apis/chats-api.js";
import { ChatsApi } from "../apis/chats-api.js";
import type { WorkbenchContext } from "../workbench-light.js";
import { module, mutate, query, stream } from "../workbench-light.js";

export type ChatsModuleContext = WorkbenchContext & ChatsApiContext;

/**
 * Workbench-light version of the Chats API.
 *
 * This is intentionally a thin wrapper around the existing implementation
 * while we migrate transports/CLI to consume the built API + schema.
 */
export const chats = module((ctx: ChatsModuleContext) => {
  const impl = new ChatsApi(ctx);

  return {
    api: {
      health: query(z.undefined(), z.literal("ok"), async () => "ok" as const),

      create: mutate(
        z.object({ providerId: z.string().optional() }).optional(),
        z.string(),
        async (input) => {
          return await impl.create(input?.providerId);
        }
      ),

      send: stream(
        z.object({ chatId: z.string(), prompt: z.string() }),
        z.string(),
        async function* ({ chatId, prompt }) {
          yield* impl.send(chatId, prompt);
        },
        { transport: "serverStream" }
      ),

      close: mutate(z.object({ chatId: z.string() }), z.literal("ok"), async ({ chatId }) => {
        return (await impl.close(chatId)) as "ok";
      })
    }
  };
});

