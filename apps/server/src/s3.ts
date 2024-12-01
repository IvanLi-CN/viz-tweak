import { Client } from "minio";
import { config } from "./config.ts";

const client = new Client({
  endPoint: config.S3_ENDPOINT,
  port: config.S3_PORT,
  useSSL: config.S3_USE_SSL,
  accessKey: config.S3_ACCESS_KEY_ID,
  secretKey: config.S3_SECRET_ACCESS_KEY,
  region: config.S3_REGION,
  pathStyle: config.S3_PATH_STYLE,
});

export const presignedPutUrl = (
  key: string,
  uploadId?: string,
  partNumber?: number,
) => {
  return client.presignedUrl(
    "PUT",
    config.S3_BUCKET_NAME,
    `${config.S3_KEY_PREFIX}/${key}`,
    60,
    uploadId && partNumber
      ? { uploadId, partNumber: partNumber.toString() }
      : undefined,
  );
};

export const presignedGetUrl = (key: string) => {
  return client.presignedGetObject(
    config.S3_BUCKET_NAME,
    `${config.S3_KEY_PREFIX}/${key}`,
    60,
  );
};

export const initiateMultipartUpload = (key: string, mime?: string | null) => {
  return client.initiateNewMultipartUpload(
    config.S3_BUCKET_NAME,
    `${config.S3_KEY_PREFIX}/${key}`,
    {
      "content-type": mime || "application/octet-stream",
    },
  );
};

export const completeMultipartUpload = (
  key: string,
  uploadId: string,
  parts: {
    part: number;
    etag?: string;
  }[],
) => {
  return client.completeMultipartUpload(
    config.S3_BUCKET_NAME,
    `${config.S3_KEY_PREFIX}/${key}`,
    uploadId,
    parts,
  );
};

export const abortMultipartUpload = (key: string, uploadId: string) => {
  return client.abortMultipartUpload(
    config.S3_BUCKET_NAME,
    `${config.S3_KEY_PREFIX}/${key}`,
    uploadId,
  );
};

export const removeIncompleteMultipartUpload = (key: string) => {
  return client.removeIncompleteUpload(
    config.S3_BUCKET_NAME,
    `${config.S3_KEY_PREFIX}/${key}`,
  );
};