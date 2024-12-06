import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import axios from "axios";
import { useAtom } from "jotai";
import pLimit from "p-limit";
import { useCallback } from "react";
import {
  type UploadChunkStatus,
  chunksAtom,
  fileAtom,
} from "../../store/upload.ts";
import { type Chunk, getChunks } from "../helpers/file.ts";
import { trpc } from "../helpers/trpc.ts";

export const useUpload = () => {
  const navigate = useNavigate();

  const [, setFile] = useAtom(fileAtom);
  const [, setChunks] = useAtom(chunksAtom);

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

  const {
    mutateAsync: createAttachment,
    isPending,
    isIdle,
    isPaused,
    isSuccess,
    error,
  } = useMutation({
    mutationKey: ["crate-attachment"],
    mutationFn: async (file: File | undefined) => {
      setFile(file);
      setChunks([]);

      if (!file) {
        return;
      }

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
              updateChunk(part, "pending", ev.total ? ev.loaded / ev.total : 0);
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

      return await trpc.attachments.completeMultipart
        .mutate({
          id,
          uploadId,
          parts,
        })
        .then(() => ({ id, url }));
    },
    onSuccess: (data) => {
      // clean up

      setFile(undefined);
      setChunks([]);

      if (data) {
        navigate({
          to: `/attachments/${data.id}`,
        });
      }
    },
  });

  return {
    createAttachment,
    isPending,
    isIdle,
    isPaused,
    isSuccess,
    error,
  };
};
