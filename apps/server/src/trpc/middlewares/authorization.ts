import { TRPCError, initTRPC } from "@trpc/server";
import { config } from "../../config.ts";
import type { Context } from "../context.ts";

export const t = initTRPC.context<Context>().create();

export const protectedProcedure = t.procedure.use(
  async function isAuthed(opts) {
    const { ctx } = opts;
    if (!ctx.user && !config.ALLOW_ANONYMOUS) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return opts.next({
      ctx: {
        user: ctx.user ?? "anonymous",
      },
    });
  },
);
