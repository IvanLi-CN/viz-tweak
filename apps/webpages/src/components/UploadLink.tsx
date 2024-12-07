import { Link } from "@tanstack/react-router";
import { useDndUpload } from "../hooks/useDndUpload.tsx";

const UploadLink = () => {
  const { onDrop, onDragEnter, onDragLeave, onDragOver, dropRef } =
    useDndUpload<HTMLAnchorElement>();

  return (
    <Link
      onClickCapture={() => dropRef.current?.classList.remove("bg-primary/20")}
      to="/upload/reset"
      ref={dropRef}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="btn btn-primary btn-sm"
    >
      <span className="iconify solar--cloud-upload-bold-duotone text-lg" />
      <span>Upload</span>
    </Link>
  );
};

export default UploadLink;
