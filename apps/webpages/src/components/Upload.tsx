import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
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
import { type Chunk, getChunks } from "../helpers/file.ts";
import { trpc } from "../helpers/trpc.ts";

type ChunkStatus = "pending" | "done" | "error";

const Upload: FC = () => {
  const navigate = useNavigate();

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
    isPaused,
    isSuccess,
    error,
  } = useMutation({
    mutationKey: ["crate-attachment"],
    mutationFn: async (file: File) => {
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
        status: "pending" as ChunkStatus,
      }));
      setChunks(chunks);

      const uploadChunk = async ({ part, blob }: Chunk) => {
        const { url } = await trpc.attachments.presignedPartUrl.mutate({
          id,
          uploadId,
          partNumber: part,
        });

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
          return req.headers.get("etag") ?? undefined;
        });

        updateChunk(part, "done");

        return { part, etag };
      };
      const limit = pLimit(1);

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
      navigate({
        to: `/attachments/${data.id}`,
      });
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
    <div
      className={clsx(
        "border-2 border-dashed border-base-content/50 rounded-box",
        "hover:cursor-pointer hover:border-primary/80 hover:shadow-lg hover:text-primary",
        "active:border-primary active:bg-primary/10",
        "transition-colors",
      )}
    >
      {error && (
        <div className="p-4">
          <div>{error.message}</div>
        </div>
      )}
      {isPaused && (
        <div className="p-4">
          <div>Paused</div>
        </div>
      )}
      {isIdle && (
        <label className="p-4 flex justify-center items-center min-h-96">
          <div>{isPending ? "Uploading..." : "Upload"}</div>
          <input
            type="file"
            hidden
            onChange={handleChange}
            onClickCapture={handleClick}
          />
        </label>
      )}
      {isPending && (
        <div className="p-4 flex justify-center items-center min-h-96">
          <div>Uploading...</div>
        </div>
      )}
      {isSuccess && (
        <div className="p-4 flex justify-center items-center min-h-96">
          <div>Uploaded</div>
        </div>
      )}
    </div>
  );
};

export default Upload;
