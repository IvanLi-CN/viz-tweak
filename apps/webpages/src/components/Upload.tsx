import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import ky from "ky";
import pLimit from "p-limit";
import {
  type ChangeEventHandler,
  type FC,
  type MouseEventHandler,
  useCallback,
  useState,
} from "react";
import { type Chunk, getChunks, getExtension } from "../helpers/file.ts";

type ChunkStatus = "pending" | "done" | "error";

const Upload: FC = () => {
  const [chunks, setChunks] = useState<(Chunk & { status: ChunkStatus })[]>([]);

  const updateChunk = useCallback((number: number, status: ChunkStatus) => {
    setChunks((prev) =>
      prev.map((c) => {
        if (c.part === number) {
          return { ...c, status };
        }

        return c;
      }),
    );
  }, []);

  const {
    mutateAsync: createAttachment,
    isPending,
    isIdle,
    error,
  } = useMutation({
    mutationKey: ["crate-attachment"],
    mutationFn: async (file: File) => {
      const mime = file.type;

      const { id, url } = await ky<{ id: string; url: string }>(
        "/api/attachments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mime,
            filename: file.name,
          }),
        },
      ).json();

      const { uploadId } = await ky<{ uploadId: string }>(
        `/api/attachments/${id}/multipart`,
        {
          method: "POST",
        },
      ).json();

      const chunks = getChunks(file).map((c) => ({
        ...c,
        status: "pending" as ChunkStatus,
      }));
      setChunks(chunks);

      const uploadChunk = async ({ part, blob }: Chunk) => {
        const { url } = await ky<{ url: string }>(
          `/api/attachments/${id}/multipart/${uploadId}/parts/${part}`,
          {
            method: "POST",
          },
        ).json();

        const etag = await ky(url, {
          method: "PUT",
          body: blob,
          headers: {
            "Content-Type": "application/octet-stream",
          },
          retry: {
            limit: 3,
          },
        }).then((req) => {
          return req.headers.get("etag");
        });

        updateChunk(part, "done");

        return { part, etag };
      };
      const limit = pLimit(1);

      const parts = await Promise.all(
        chunks.map((c) => limit(() => uploadChunk(c))),
      );

      return await ky<{ id: string; url: string }>(
        `/api/attachments/${id}/multipart/${uploadId}/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ parts }),
        },
      ).json();
    },
    onSuccess: (data) => {
      console.log(data);
    },
  });

  const handleClick: MouseEventHandler<HTMLInputElement> = (ev) => {
    ev.currentTarget.value = "";
  };

  const handleChange: ChangeEventHandler<HTMLInputElement> = (ev) => {
    if (!ev.currentTarget.files) {
      return;
    }

    const file = ev.currentTarget.files[0];

    if (!file) {
      return;
    }

    createAttachment(file);
  };

  return (
    <label
      className={clsx(
        "border-2 border-dashed border-base-content/50 rounded-box p-4 block",
        "flex justify-center items-center",
        "min-h-96",
        "hover:cursor-pointer hover:border-primary/80 hover:shadow-lg hover:text-primary",
        "active:border-primary active:bg-primary/10",
        "transition-colors",
      )}
    >
      <div>{isPending ? "Uploading..." : "Upload"}</div>
      <input type="file" hidden onChange={handleChange} />
    </label>
  );
};

export default Upload;
