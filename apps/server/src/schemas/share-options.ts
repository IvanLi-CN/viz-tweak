import { z } from "zod";

export const shareOptionsSchema = z.object({
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

