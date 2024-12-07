import { useNavigate } from "@tanstack/react-router";
import { type DragEventHandler, useRef } from "react";
import { toast } from "react-toastify";
import { useUpload } from "./useUpload.tsx";

export const useDndUpload = <ELEM extends HTMLElement>() => {
  const createAttachment = useUpload();
  const navigate = useNavigate();

  const dropRef = useRef<ELEM>(null);

  const onDrop: DragEventHandler<ELEM> = (event) => {
    event.preventDefault();
    event.stopPropagation();
    dropRef.current?.classList.remove("bg-primary/20");

    const files = Array.from(event.dataTransfer.files);
    const file = files[0];

    if (!file) {
      toast("Please drag a file", { type: "error" });
      return;
    }

    navigate({
      to: "/upload",
      state: (prev) => ({
        ...prev,
        reset: true,
      }),
    });
    createAttachment(file);
  };

  const onDragOver: DragEventHandler<HTMLElement> = (event) => {
    event.dataTransfer.dropEffect = "copy";
    dropRef.current?.classList.add("bg-primary/20");

    event.preventDefault();
    event.stopPropagation();
  };

  const onDragLeave: DragEventHandler<HTMLElement> = (event) => {
    dropRef.current?.classList.remove("bg-primary/20");
    event.preventDefault();
    event.stopPropagation();
  };

  const onDragEnter: DragEventHandler<HTMLElement> = (event) => {
    event.dataTransfer.dropEffect = "copy";
    dropRef.current?.classList.add("bg-primary/20");

    event.preventDefault();
    event.stopPropagation();
  };

  return {
    dropRef,
    onDrop,
    onDragEnter,
    onDragLeave,
    onDragOver,
  };
};
