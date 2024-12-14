import { TRPCError, initTRPC } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { attachments } from "../../db/schema.ts";
import { config } from "../config.ts";
import { db } from "../db.ts";
import { getImagorUrl } from "../helpers/imagor.ts";
import { presignedGetUrl } from "../s3.ts";
import { shareOptionsSchema } from "../schemas/share-options.ts";

const t = initTRPC.create();

export const sharesRouter = t.router({
  generateUrl: t.procedure
    .input(
      z.object({
        attachmentId: z.string(),
        options: shareOptionsSchema,
      }),
    )
    .query(async ({ input }) => {
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

      filterList.push("strip_exif()");

      if (filterList.length > 0) {
        imagorPathList.push(`filters:${filterList.join(":")}`);
      }

      imagorPathList.push(encodeURIComponent(url));

      const imagorPath = imagorPathList.join("/");

      return getImagorUrl(imagorPath);
    }),

  presets: t.procedure
    .input(
      z.object({
        attachmentId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { attachmentId } = input;

      const presets: {
        name: string;
        options: z.infer<typeof shareOptionsSchema>;
        url?: string;
      }[] = [
        {
          name: "Original",
          options: shareOptionsSchema.parse({}),
          url: new URL(`s/${attachmentId}`, config.SERVER_URL).href,
        },
        {
          name: "Webp",
          options: shareOptionsSchema.parse({
            format: "webp",
          }),
          url: new URL(`s/${attachmentId}.webp`, config.SERVER_URL).href,
        },
        {
          name: "1K",
          options: shareOptionsSchema.parse({
            width: 1024,
            height: 1024,
            format: "webp",
          }),
        },
        {
          name: "2K",
          options: shareOptionsSchema.parse({
            width: 2048,
            height: 2048,
            format: "webp",
          }),
        },
        {
          name: "4K",
          options: shareOptionsSchema.parse({
            width: 4096,
            height: 4096,
            format: "webp",
          }),
        },
        {
          name: "Square",
          options: shareOptionsSchema.parse({
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
            options: z.infer<typeof shareOptionsSchema>;
            url: string;
          }> => {
            const url = (() => {
              if (preset.url) {
                return preset.url;
              }

              const url = new URL(`s/${attachmentId}`, config.SERVER_URL);

              for (const [key, value] of Object.entries(preset.options)) {
                url.searchParams.set(key, value.toString());
              }

              return url.href;
            })();

            return {
              ...preset,
              url,
            };
          },
        ),
      );
    }),
});
