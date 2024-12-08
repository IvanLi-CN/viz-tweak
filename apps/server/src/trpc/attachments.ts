import { extname } from "node:path";
import { TRPCError, initTRPC } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { AttachmentStatus, attachments } from "../../db/schema.ts";
import { generateImageInfo } from "../ai.ts";
import { config } from "../config.ts";
import { db } from "../db.ts";
import { getImagorUrl } from "../helpers/imagor.ts";
import {
  completeMultipartUpload,
  initiateMultipartUpload,
  presignedGetUrl,
  presignedPutUrl,
} from "../s3.ts";
import { protectedProcedure } from "./middlewares/authorization.ts";

const t = initTRPC.create();

export const attachmentsRouter = t.router({
  create: protectedProcedure
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
      const path = `${id}${ext ? `${ext}` : ""}`;
      const url = await presignedPutUrl(path);

      await db.insert(attachments).values({
        id,
        path,
        slug: path,
        mime,
        status: AttachmentStatus.Created,
        owner: ctx.user,
        name: filename,
        filename,
        size: 0,
        createdAt: new Date(),
      });

      return { id, url };
    }),

  initiateMultipart: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
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

  presignedPartUrl: protectedProcedure
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
        where: and(eq(attachments.id, id), eq(attachments.owner, ctx.user)),
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

  completeMultipart: protectedProcedure
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
    .mutation(async ({ input, ctx }) => {
      const { id, uploadId, parts } = input;

      const attachment = await db.query.attachments.findFirst({
        where: and(eq(attachments.id, id), eq(attachments.owner, ctx.user)),
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

      if (
        attachment.mime?.startsWith("image/") ||
        attachment.mime?.startsWith("video/")
      ) {
        const metadata = await fetch(
          getImagorUrl(`meta/${encodeURIComponent(url)}`),
        ).then((res) => res.json());

        const urlForAi = getImagorUrl(
          `fit-in/1024x1024/filters:format(webp)/${encodeURIComponent(url)}`,
        );
        const { name, description, slug } = await generateImageInfo(urlForAi);

        const updated = await db
          .update(attachments)
          .set({
            status: AttachmentStatus.Uploaded,
            metadata,
            size,
            name,
            description,
            slug,
          })
          .where(and(eq(attachments.id, id), eq(attachments.owner, ctx.user)))
          .returning();
        return { updated, url };
      }

      const updated = await db
        .update(attachments)
        .set({
          status: AttachmentStatus.Uploaded,
          size,
        })
        .where(and(eq(attachments.id, id), eq(attachments.owner, ctx.user)))
        .returning();
      return { updated, url };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const id = input.id;
      const attachment = await db.query.attachments.findFirst({
        where: and(eq(attachments.id, id), eq(attachments.owner, ctx.user)),
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
