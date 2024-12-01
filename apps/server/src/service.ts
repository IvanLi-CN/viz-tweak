import { sleep } from "bun";
import { count, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { attachments } from "../db/schema.ts";
import { db } from "./db.ts";
import { logger } from "./logger.ts";
import { presignedGetUrl, presignedPutUrl } from "./s3.ts";

type CreateAttachmentOptions = {
  mime: string;
  extname?: string;
};
export const createAttachment = async ({
  mime,
  extname,
}: CreateAttachmentOptions): Promise<{ id: string; url: string }> => {};

export const getAttachment = async (id: string) => {
  const attachment = await db
    .select()
    .from(attachments)
    .where(eq(attachments.id, id))
    .then((res) => res[0]);

  if (!attachment) {
    return null;
  }

  const url = await presignedGetUrl(attachment.path);

  return {
    ...attachment,
    url,
  };
};

