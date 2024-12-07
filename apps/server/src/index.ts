import { Hono } from "hono";

import { join } from "node:path";
import { trpcServer } from "@hono/trpc-server";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { pinoLogger } from "hono-pino";
import { serveStatic } from "hono/bun";
import { z } from "zod";
import { attachments } from "../db/schema.ts";
import { db } from "./db.ts";
import { logger } from "./logger.ts";
import { presignedGetUrl } from "./s3.ts";
import { exit$ } from "./shared.ts";
import { createContext } from "./trpc/context.ts";
import { appRouter } from "./trpc/trpc.ts";

const skipMigration = process.argv.includes("--skip-migration");

if (!skipMigration) {
  migrate(db, { migrationsFolder: join(import.meta.dir, "../drizzle") });
}

const app = new Hono();

app.use(
  pinoLogger({
    pino: logger,
  }),
);

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  }),
);

export const shareOptionsSchema = z.object({
  width: z.coerce.number().int().positive().optional(),
  height: z.coerce.number().int().positive().optional(),
  orient: z.coerce
    .number()
    .pipe(
      z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]),
    )
    .optional(),
  fitIn: z.coerce.boolean().default(true),
  smart: z.coerce.boolean().default(true),
  format: z
    .enum(["jpeg", "png", "gif", "webp", "tiff", "avif", "jp2"])
    .optional(),
  preview: z.coerce.boolean().default(true),
});

app.get("/s/:filename", zValidator("query", shareOptionsSchema), async (c) => {
  const filename = c.req.param("filename");
  const options = c.req.valid("query");

  const [attachmentId, extension, ...badParams] = filename.split(".");

  if (badParams.length > 0) {
    return new Response("Invalid filename", { status: 400 });
  }

  const attachment = await db.query.attachments.findFirst({
    where: eq(attachments.id, attachmentId),
  });

  if (!attachment) {
    return new Response("Attachment not found", { status: 404 });
  }

  const formatWhitelist = ["jpeg", "png", "gif", "webp"] as const;
  const format = extension
    ?.toLocaleLowerCase()
    .replace(/^jpg$/, "jpeg") as (typeof formatWhitelist)[number];
  if (formatWhitelist.includes(format) || !extension) {
    const url = await appRouter.createCaller({}).shares.generateUrl({
      attachmentId,
      options: {
        format,
        ...options,
      },
    });

    return await fetch(url);
  }

  const url = await presignedGetUrl(attachment.path);

  return await fetch(url).then((res) => {
    res.headers.set("X-Vt-Source", "raw");

    return res;
  });
});

app.get(
  "/*",
  serveStatic({
    root: "../webpages/dist",
  }),
);

app.get(
  "*",
  serveStatic({
    root: "../webpages/dist",
    rewriteRequestPath: (path) => {
      return "/index.html";
    },
  }),
);

const server = Bun.serve({
  port: process.env.PORT ? Number.parseInt(process.env.PORT) : undefined,
  fetch: app.fetch,
});

exit$.subscribe(() => {
  logger.warn("Stopping server");
  server.stop().then(() => {
    logger.info("Server stopped");
  });
});

logger.info(`Server running on ${server.url}`);
