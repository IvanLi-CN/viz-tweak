import { createHmac } from "node:crypto";
import { TRPCError, initTRPC } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { attachments } from "../../db/schema.ts";
import { config } from "../config.ts";
import { db } from "../db.ts";
import { presignedGetUrl } from "../s3.ts";

const t = initTRPC.create();

const imagorOptionsSchema = z.object({
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  orient: z
    .union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)])
    .optional(),
  fitIn: z.boolean().default(true),
  smart: z.boolean().default(true),
  format: z
    .enum(["jpeg", "png", "gif", "webp", "tiff", "avif", "jp2"])
    .optional(),
  preview: z.boolean().default(true),
});

export const sharesRouter = t.router({
  generateUrl: t.procedure
    .input(
      z.object({
        attachmentId: z.string(),
        options: imagorOptionsSchema,
      }),
    )
    .query(async ({ input, ctx }) => {
      const { attachmentId, options } = input;

      const attachment = await db.query.attachments.findFirst({
        where: eq(attachments.id, attachmentId),
      });

      if (!attachment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Attachment not found",
        });
      }

      if (
        !attachment.mime ||
        (!attachment.mime.startsWith("image/") &&
          !attachment.mime.startsWith("video/"))
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Attachment is not an image or video",
        });
      }

      const url = await presignedGetUrl(attachment.path);

      const imagorPathList: string[] = [];

      if (options.fitIn) {
        imagorPathList.push("fit-in");
      }

      if (options.width || options.height) {
        imagorPathList.push(`${options.width ?? 0}x${options.height ?? 0}`);
      }

      if (options.smart) {
        imagorPathList.push("smart");
      }

      const filterList: string[] = [];

      if (options.format) {
        filterList.push(`format(${options.format})`);
      }

      if (options.orient) {
        filterList.push(`orient(${options.orient})`);
      }

      if (options.preview) {
        filterList.push("preview()");
      }

      if (filterList.length > 0) {
        imagorPathList.push(`filters:${filterList.join(":")}`);
      }

      imagorPathList.push(encodeURIComponent(url));

      const imagorPath = imagorPathList.join("/");

      const hash =
        config.IMAGOR_SECRET === "UNSAFE"
          ? "UNSAFE"
          : createHmac(config.IMAGOR_ALGORITHM, config.IMAGOR_SECRET)
              .update(imagorPath)
              .digest("base64")
              .slice(0, config.IMAGOR_SIGNER_TRUNCATE)
              .replaceAll(/\+/g, "-")
              .replaceAll(/\//g, "_");
      const imagorUrl = `${config.IMAGOR_URL}/${hash}/${imagorPath}`;

      return imagorUrl;
    }),

  presets: t.procedure
    .input(
      z.object({
        attachmentId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { attachmentId } = input;

      const presets: {
        name: string;
        options: z.infer<typeof imagorOptionsSchema>;
      }[] = [
        {
          name: "Original",
          options: imagorOptionsSchema.parse({}),
        },
        {
          name: "Webp",
          options: imagorOptionsSchema.parse({
            format: "webp",
          }),
        },
        {
          name: "1K",
          options: imagorOptionsSchema.parse({
            width: 1024,
            height: 1024,
            format: "webp",
          }),
        },
        {
          name: "2K",
          options: imagorOptionsSchema.parse({
            width: 2048,
            height: 2048,
            format: "webp",
          }),
        },
        {
          name: "4K",
          options: imagorOptionsSchema.parse({
            width: 4096,
            height: 4096,
            format: "webp",
          }),
        },
        {
          name: "Square",
          options: imagorOptionsSchema.parse({
            width: 1024,
            height: 1024,
            fitIn: false,
            smart: true,
            format: "webp",
          }),
        },
      ];

      return await Promise.all(
        presets.map(
          async (
            preset,
          ): Promise<{
            name: string;
            options: z.infer<typeof imagorOptionsSchema>;
            url: string;
          }> => {
            return {
              ...preset,
              url: await sharesRouter.createCaller({ ctx }).generateUrl({
                attachmentId,
                options: preset.options,
              }),
            };
          },
        ),
      );
    }),
});
