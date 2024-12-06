import { useCallback, useEffect } from "react";

const useWindowFileDragDrop = (onDrop: (files: FileList) => void) => {
  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      if (event.dataTransfer?.files) {
        onDrop(event.dataTransfer.files);
      }
    },
    [onDrop],
  );

  useEffect(() => {
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [handleDragOver, handleDrop]);

  return null; // This hook doesn't render anything
};

export default useWindowFileDragDrop;
