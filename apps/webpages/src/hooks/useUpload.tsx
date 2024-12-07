import axios from "axios";
import { useAtom } from "jotai";
import pLimit from "p-limit";
import { useCallback } from "react";
import { type Chunk, getChunks } from "../helpers/file.ts";
import { trpc } from "../helpers/trpc.ts";
import {
  type UploadChunkStatus,
  chunksAtom,
  fileAtom,
  uploadErrorAtom,
  uploadStatusAtom,
  uploadedAttachmentInfoAtom,
} from "../store/upload.ts";

export const useUpload = () => {
  const [, setFile] = useAtom(fileAtom);
  const [, setChunks] = useAtom(chunksAtom);
  const [, setStatus] = useAtom(uploadStatusAtom);
  const [, setError] = useAtom(uploadErrorAtom);
  const [, setAttachmentInfo] = useAtom(uploadedAttachmentInfoAtom);

  const updateChunk = useCallback(
    (number: number, status: UploadChunkStatus, progress?: number) => {
      setChunks((prev) =>
        prev.map((c) => {
          if (c.part === number) {
            return { ...c, status, progress: progress ?? c.progress };
          }

          return c;
        }),
      );
    },
    [setChunks],
  );

  const createAttachment = useCallback(
    async (file: File | undefined) => {
      try {
        setFile(file);
        setChunks([]);
        setAttachmentInfo(undefined);

        if (!file) {
          setStatus("idle");
          return;
        }

        setStatus("pending");
        const mime = file.type;

        const { id, url } = await trpc.attachments.create.mutate({
          filename: file.name,
          mime,
        });

        const { uploadId } = await trpc.attachments.initiateMultipart.mutate({
          id,
        });

        const chunks = getChunks(file).map((c) => ({
          ...c,
          status: "pending" as UploadChunkStatus,
          progress: 0,
        }));
        setChunks(chunks);

        const uploadChunk = async ({ part, blob }: Chunk) => {
          const { url } = await trpc.attachments.presignedPartUrl.mutate({
            id,
            uploadId,
            partNumber: part,
          });
          updateChunk(part, "pending", 0);

          const etag = await axios
            .put(url, blob, {
              headers: {
                "Content-Type": "application/octet-stream",
              },
              onUploadProgress: (ev) => {
                updateChunk(
                  part,
                  "pending",
                  ev.total ? ev.loaded / ev.total : 0,
                );
              },
            })
            .then((req) => {
              return req.headers.etag ?? undefined;
            });

          updateChunk(part, "done", 1);

          return { part, etag };
        };
        const limit = pLimit(2);

        // await Promise.all(
        //   chunks.map((c, i) =>
        //     limit(
        //       () =>
        //         new Promise<void>((resolve, reject) => {
        //           let p = 0;
        //           const intervalId = setInterval(() => {
        //             p += 0.003;
        //             updateChunk(c.part, "pending", p);
        //           }, 100);
        //           setTimeout(() => {
        //             clearInterval(intervalId);
        //             if (i === chunks.length - 1) {
        //               reject(new Error("All chunks uploaded, but mock error"));
        //             } else {
        //               resolve();
        //             }
        //           }, 30 * 1000);
        //         }),
        //     ),
        //   ),
        // );

        const parts = await Promise.all(
          chunks.map((c) => limit(() => uploadChunk(c))),
        );

        const result = await trpc.attachments.completeMultipart
          .mutate({
            id,
            uploadId,
            parts,
          })
          .then(() => ({ id, url }));

        setAttachmentInfo(result);
        setStatus("done");

        return result;
      } catch (e) {
        setStatus("error");
        setError(e as Error);
        throw e;
      }
    },
    [setFile, setChunks, updateChunk, setStatus, setError, setAttachmentInfo],
  );

  return createAttachment;
};
