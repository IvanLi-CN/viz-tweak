import { fallback } from "@tanstack/zod-adapter";
import { z } from "zod";

export const shareOptionsSchema = z.object({
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  orient: z
    .union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)])
    .optional(),
  fitIn: fallback(z.boolean(), true).default(true),
  smart: fallback(z.boolean(), true).default(true),
  format: z
    .enum(["jpeg", "png", "gif", "webp", "tiff", "avif", "jp2"])
    .optional(),
});
export type ShareOptions = z.infer<typeof shareOptionsSchema>;
