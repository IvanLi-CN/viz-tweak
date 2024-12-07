import { useNavigate } from "@tanstack/react-router";
import { type FC, useCallback, useEffect } from "react";
import { useUpload } from "../hooks/useUpload.tsx";

export const PasteUpload: FC = () => {
  const navigate = useNavigate();
  const createAttachment = useUpload();

  const handlePaste = useCallback(
    (ev: ClipboardEvent) => {
      ev.preventDefault();
      ev.stopPropagation();

      const items = ev.clipboardData?.items;

      if (!items) {
        return;
      }

      const item = items[0];

      if (!item) {
        return;
      }

      if (item.kind !== "file") {
        return;
      }

      const file = item.getAsFile();

      if (!file) {
        return;
      }

      createAttachment(file);
      navigate({
        to: "/upload",
      });
    },
    [createAttachment, navigate],
  );

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  return null;
};
