import { extname } from "node:path";
import { TRPCError, initTRPC } from "@trpc/server";
import { count, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { AttachmentStatus, attachments } from "../../db/schema.ts";
import { db } from "../db.ts";
import { getImagorUrl } from "../helpers/imagor.ts";
import {
  completeMultipartUpload,
  initiateMultipartUpload,
  presignedGetUrl,
  presignedPutUrl,
} from "../s3.ts";

const t = initTRPC.create();

export const attachmentsRouter = t.router({
  create: t.procedure
    .input(
      z.object({
        mime: z.string(),
        filename: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { mime, filename } = input;

      const id = await (async () => {
        while (true) {
          const id = nanoid(12);

          const exists = await db.query.attachments.findFirst({
            where: eq(attachments.id, id),
          });

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
        owner: "anonymous",
        name: filename,
        filename,
        size: 0,
        createdAt: new Date(),
      });

      return { id, url };
    }),

  initiateMultipart: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const id = input.id;

      const attachment = await db
        .select()
        .from(attachments)
        .where(eq(attachments.id, id))
        .then((res) => res[0]);

      if (!attachment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Attachment with ID ${id} not found`,
        });
      }

      if (attachment.status !== AttachmentStatus.Created) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Attachment with ID ${id} already uploaded`,
        });
      }

      const uploadId = await initiateMultipartUpload(
        attachment.path,
        attachment.mime,
      );
      return { uploadId };
    }),

  presignedPartUrl: t.procedure
    .input(
      z.object({
        id: z.string(),
        uploadId: z.string(),
        partNumber: z.number().int().positive(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, uploadId, partNumber } = input;

      const attachment = await db.query.attachments.findFirst({
        where: eq(attachments.id, id),
      });
      if (!attachment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Attachment with ID ${id} not found`,
        });
      }

      if (attachment.status !== AttachmentStatus.Created) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Attachment with ID ${id} already uploaded`,
        });
      }

      const url = await presignedPutUrl(attachment.path, uploadId, partNumber);
      return { url };
    }),

  completeMultipart: t.procedure
    .input(
      z.object({
        id: z.string(),
        uploadId: z.string(),
        parts: z.array(
          z.object({
            part: z.number(),
            etag: z.string().optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, uploadId, parts } = input;

      const attachment = await db.query.attachments.findFirst({
        where: eq(attachments.id, id),
      });
      if (!attachment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Attachment with ID ${id} not found`,
        });
      }

      if (attachment.status !== AttachmentStatus.Created) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Attachment with ID ${id} already uploaded`,
        });
      }

      await completeMultipartUpload(attachment.path, uploadId, parts);

      const url = await presignedGetUrl(attachment.path);

      const size = await fetch(url, {
        method: "HEAD",
      })
        .then((res) => res.headers.get("content-length"))
        .then((size) => Number(size) || 0);

      const metadata = await fetch(
        getImagorUrl(`meta/${encodeURIComponent(url)}`),
      ).then((res) => res.json());

      const updated = await db
        .update(attachments)
        .set({ status: AttachmentStatus.Uploaded, metadata, size })
        .where(eq(attachments.id, id))
        .returning();

      return { updated, url };
    }),

  get: t.procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const id = input.id;
      const attachment = await db.query.attachments.findFirst({
        where: eq(attachments.id, id),
      });

      if (!attachment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Attachment with ID ${id} not found`,
        });
      }

      const url = await presignedGetUrl(attachment.path);

      return {
        ...attachment,
        url,
      };
    }),
});
