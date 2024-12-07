import { Link, useNavigate } from "@tanstack/react-router";
import clsx from "clsx";
import { useAtom } from "jotai";
import {
  type ChangeEventHandler,
  type FC,
  type MouseEventHandler,
  useEffect,
  useState,
} from "react";
import { useDndUpload } from "../hooks/useDndUpload.tsx";
import { useUpload } from "../hooks/useUpload.tsx";
import {
  chunksAtom,
  fileAtom,
  uploadErrorAtom,
  uploadStatusAtom,
  uploadedAttachmentInfoAtom,
} from "../store/upload.ts";

const Upload: FC = () => {
  const navigate = useNavigate();

  const [chunks] = useAtom(chunksAtom);
  const [blobUrl, setBlobUrl] = useState<string>();
  const [file] = useAtom(fileAtom);
  const [status] = useAtom(uploadStatusAtom);
  const [error] = useAtom(uploadErrorAtom);
  const [attachmentInfo] = useAtom(uploadedAttachmentInfoAtom);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  }>();
  
  const createAttachment = useUpload();
  const { onDrop, onDragEnter, onDragLeave, onDragOver, dropRef } =
    useDndUpload<HTMLLabelElement>();

  useEffect(() => {
    if (attachmentInfo?.id) {
      navigate({
        to: `/attachments/${attachmentInfo.id}`,
      });
    }
  }, [attachmentInfo, navigate]);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setBlobUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file]);

  const handleClick: MouseEventHandler<HTMLInputElement> = (ev) => {
    ev.currentTarget.value = "";
    createAttachment(undefined);
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
        "border-2 border-dashed border-base-content/50 rounded-box",
        "hover:cursor-pointer hover:border-primary/80 hover:shadow-lg hover:text-primary",
        "active:border-primary active:bg-primary/10",
        "transition-colors",
        "max-w-6xl mx-auto aspect-video",
        "flex flex-col items-center justify-evenly",
        "relative",
      )}
      ref={dropRef}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {blobUrl && status !== "idle" && (
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
      {status === "idle" && (
        <div className="p-4 flex justify-center items-center">
          <div>Drag and drop or click to upload or paste a file.</div>
        </div>
      )}
      {status === "pending" && (
        <div className="p-4 flex justify-center items-center min-h-96">
          <div>Uploading...</div>
        </div>
      )}
      {status === "done" && attachmentInfo && (
        <div className="p-4 flex justify-center items-center min-h-96">
          <div>
            Uploaded. <Link to={`/attachments/${attachmentInfo.id}`}>View</Link>
          </div>
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
