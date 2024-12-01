import { Hono } from "hono";

import { extname } from "node:path";
import { zValidator } from "@hono/zod-validator";
import { sleep } from "bun";
import { count, eq } from "drizzle-orm";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { pinoLogger } from "hono-pino";
import { serveStatic } from "hono/bun";
import { nanoid } from "nanoid";
import { z } from "zod";
import { AttachmentStatus, attachments } from "../db/schema.ts";
import { db } from "./db.ts";
import { logger } from "./logger.ts";
import {
  completeMultipartUpload,
  initiateMultipartUpload,
  presignedGetUrl,
  presignedPutUrl,
} from "./s3.ts";
import { createAttachment, getAttachment } from "./service.ts";
import { exit$ } from "./shared.ts";

const skipMigration = process.argv.includes("--skip-migration");

if (!skipMigration) {
  migrate(db, { migrationsFolder: "./migrations" });
}

const app = new Hono();

app.use(
  pinoLogger({
    pino: logger,
  }),
);

const api = new Hono();

api.all("/", (c) => c.text("OK"));

const attachmentsApi = new Hono();

attachmentsApi.post(
  "/",
  zValidator(
    "json",
    z.object({
      mime: z.string(),
      filename: z.string(),
    }),
  ),
  async (ctx) => {
    const { mime, filename } = ctx.req.valid("json");

    const id = await (async () => {
      while (true) {
        const id = nanoid(12);

        const exists = await db
          .select({ count: count() })
          .from(attachments)
          .where(eq(attachments.id, id))
          .then(([{ count }]) => count > 0);

        if (!exists) {
          return id;
        }
      }
    })();

    const ext = extname(filename);
    const path = `${id}${ext ? `.${ext}` : ""}`;
    const url = await presignedPutUrl(path);

    await db.insert(attachments).values({
      id,
      path,
      mime,
      status: AttachmentStatus.Created,
      owner: ctx.req.header("x-user-id") ?? "anonymous",
      name: filename,
      filename,
      size: 0,
      createdAt: new Date(),
    });

    return ctx.json(
      {
        id,
        url,
      },
      201,
    );
  },
);

attachmentsApi.post("/:id/multipart", async ({ req, json }) => {
  const id = req.param("id");

  const attachment = await db
    .select()
    .from(attachments)
    .where(eq(attachments.id, id))
    .then((res) => res[0]);

  if (!attachment) {
    return json(
      {
        code: "NOT_FOUND",
        error: `Attachment with ID ${id} not found`,
      },
      404,
    );
  }

  if (attachment.status !== AttachmentStatus.Created) {
    return json(
      {
        code: "CONFLICT",
        error: `Attachment with ID ${id} already uploaded`,
      },
      409,
    );
  }

  const uploadId = await initiateMultipartUpload(
    attachment.path,
    attachment.mime,
  );

  return json(
    {
      uploadId,
    },
    201,
  );
});

attachmentsApi.post(
  "/:id/multipart/:uploadId/parts/:partNumber",
  zValidator(
    "param",
    z.object({
      id: z.string(),
      uploadId: z.string(),
      partNumber: z
        .string()
        .regex(/^\d+$/, "Part number must be a number")
        .transform((arg) => Number.parseInt(arg, 10)),
    }),
  ),
  async ({ req, json }) => {
    const { id, uploadId, partNumber } = req.valid("param");

    const attachment = await getAttachment(id);
    if (!attachment) {
      return json(
        {
          code: "NOT_FOUND",
          error: `Attachment with ID ${id} not found`,
        },
        404,
      );
    }

    if (attachment.status !== AttachmentStatus.Created) {
      return json(
        {
          code: "CONFLICT",
          error: `Attachment with ID ${id} already uploaded`,
        },
        409,
      );
    }

    const url = await presignedPutUrl(attachment.path, uploadId, partNumber);

    return json(
      {
        url,
      },
      201,
    );
  },
);

attachmentsApi.post(
  "/:id/multipart/:uploadId/complete",
  zValidator(
    "json",
    z.object({
      parts: z.array(
        z.object({
          part: z.number(),
          etag: z.string().optional(),
        }),
      ),
    }),
  ),
  async ({ req, json }) => {
    const id = req.param("id");
    const uploadId = req.param("uploadId");

    const { parts } = req.valid("json");

    const attachment = await getAttachment(id);
    if (!attachment) {
      return json(
        {
          code: "NOT_FOUND",
          error: `Attachment with ID ${id} not found`,
        },
        404,
      );
    }

    if (attachment.status !== AttachmentStatus.Created) {
      return json(
        {
          code: "CONFLICT",
          error: `Attachment with ID ${id} already uploaded`,
        },
        409,
      );
    }

    await completeMultipartUpload(attachment.path, uploadId, parts);

    const updated = await db
      .update(attachments)
      .set({
        status: AttachmentStatus.Uploaded,
      })
      .where(eq(attachments.id, id))
      .returning();

    const url = await presignedGetUrl(attachment.path);

    return json(
      {
        updated,
        url,
      },
      201,
    );
  },
);

attachmentsApi.get("/:id", async ({ req, json }) => {
  const id = req.param("id");
  const attachment = await getAttachment(id);
  if (!attachment) {
    return json(
      {
        code: "NOT_FOUND",
        error: `Attachment with ID ${id} not found`,
      },
      404,
    );
  }
  return json(attachment);
});

attachmentsApi.all("/", async ({ req, json }) => {
  const counts = await db
    .select({ count: count() })
    .from(attachments)
    .then(([{ count }]) => count);
  return json(counts);
});

api.route("/attachments", attachmentsApi);

app.route("/api", api);

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

export default app;
