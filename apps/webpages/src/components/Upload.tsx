import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import axios from "axios";
import clsx from "clsx";
import ky from "ky";
import pLimit from "p-limit";
import {
  type ChangeEventHandler,
  type DragEventHandler,
  type FC,
  type MouseEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { type Chunk, getChunks } from "../helpers/file.ts";
import { trpc } from "../helpers/trpc.ts";

type ChunkStatus = "pending" | "done" | "error";

const Upload: FC = () => {
  const navigate = useNavigate();

  const [chunks, setChunks] = useState<
    (Chunk & { status: ChunkStatus; progress: number })[]
  >([]);
  const [blobUrl, setBlobUrl] = useState<string>();
  const [file, setFile] = useState<File>();
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  }>();
  const dropRef = useRef<HTMLLabelElement>(null);

  const updateChunk = useCallback(
    (number: number, status: ChunkStatus, progress?: number) => {
      setChunks((prev) =>
        prev.map((c) => {
          if (c.part === number) {
            return { ...c, status, progress: progress ?? c.progress };
          }

          return c;
        }),
      );
    },
    [],
  );

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setBlobUrl(url);
      createAttachment(file).catch(console.error);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file]);

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
      navigate({
        to: `/attachments/${data.id}`,
      });
    },
  });

  const handleClick: MouseEventHandler<HTMLInputElement> = (ev) => {
    ev.currentTarget.value = "";
    setFile(undefined);
  };

  const handleChange: ChangeEventHandler<HTMLInputElement> = (ev) => {
    if (!ev.currentTarget.files) {
      return;
    }

    const file = ev.currentTarget.files[0];

    if (!file) {
      return;
    }

    setFile(file);
  };

  const handleDrop: DragEventHandler<HTMLElement> = (ev) => {
    ev.preventDefault();

    const files = Array.from(ev.dataTransfer.files);

    if (!files.length) {
      return;
    }

    const file = files[0];

    if (!file) {
      return;
    }

    setFile(file);
  };

  const handleDragOver: DragEventHandler<HTMLElement> = (ev) => {
    ev.preventDefault();
  };

  const handleDragLeave: DragEventHandler<HTMLElement> = () => {
    dropRef.current?.classList.remove("bg-primary/20");
  };

  const handleDragEnter: DragEventHandler<HTMLElement> = (ev) => {
    console.log(ev);
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "copy";
    ev.stopPropagation();
    dropRef.current?.classList.add("bg-primary/20");
  };

  return (
    <label
      className={clsx(
        "border-2 border-dashed border-base-content/50 rounded-box",
        "hover:cursor-pointer hover:border-primary/80 hover:shadow-lg hover:text-primary",
        "active:border-primary active:bg-primary/10",
        "transition-colors",
        "max-w-6xl mx-auto aspect-video",
        "flex flex-col items-center justify-evenly",
        "relative",
      )}
      ref={dropRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDragEnter={handleDragEnter}
      onDrop={handleDrop}
    >
      {blobUrl && isPending && (
        <div className="p-4 absolute top-0 left-0 w-full h-full text-center">
          <img
            src={blobUrl}
            alt="Preview"
            className="mx-auto h-full w-full object-contain"
            onLoad={(ev) => {
              const imageEl = ev.currentTarget as HTMLImageElement;

              if (imageEl.complete) {
                const { naturalWidth, naturalHeight, width, height } = imageEl;

                const ratio = naturalWidth / naturalHeight;

                if (width / height > ratio) {
                  setImageDimensions({
                    width: Math.ceil(height * ratio),
                    height: height,
                  });
                } else {
                  setImageDimensions({
                    width: width,
                    height: Math.ceil(width / ratio),
                  });
                }
              }
            }}
          />
          <ol
            className="grid grid-cols-1 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 absolute"
            style={{
              height: `${imageDimensions?.height ?? 100}px`,
              width: `${imageDimensions?.width ?? 100}px`,
            }}
          >
            {chunks.map((c) => (
              <li
                key={c.part}
                className={clsx(
                  "backdrop-brightness-50 justify-self-end backdrop-blur-sm transition-all duration-500",
                )}
                style={{
                  width: `${(() => {
                    switch (c.status) {
                      case "pending":
                        return (1 - c.progress) * 100;
                      case "done":
                        return 0;
                      default:
                        return 100;
                    }
                  })()}%`,
                }}
              />
            ))}
          </ol>
        </div>
      )}

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
        <div className="p-4 flex justify-center items-center">
          <div>{isPending ? "Uploading..." : "Upload"}</div>
        </div>
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
      <input
        type="file"
        hidden
        onChange={handleChange}
        onClickCapture={handleClick}
      />
    </label>
  );
};

export default Upload;
