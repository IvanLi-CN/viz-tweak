import { useNavigate } from "@tanstack/react-router";
import { type FC, useCallback, useEffect } from "react";
import { useUpload } from "../hooks/useUpload.tsx";

export const PasteUpload: FC = () => {
  const navigate = useNavigate();
  const createAttachment = useUpload();

  const handlePaste = useCallback(
    async (ev: ClipboardEvent) => {
      const items = ev.clipboardData?.items;

      if (!items) {
        return;
      }

      const item = items[0];

      if (!item) {
        return;
      }

      if (item.kind !== "file") {
        const item = await navigator.clipboard.read().then((res) => res[0]);

        for (const type of item.types) {
          if (type.startsWith("image/")) {
            const blob = await item.getType(type);

            ev.preventDefault();
            ev.stopPropagation();

            createAttachment(
              new File([blob], "clipboard.png", {
                type,
              }),
            );
            navigate({
              to: "/upload",
            });
            return;
          }
        }

        return;
      }

      const file = item.getAsFile();

      if (!file) {
        return;
      }

      ev.preventDefault();
      ev.stopPropagation();

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
