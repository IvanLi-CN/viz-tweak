import { Link } from "@tanstack/react-router";
import { useDndUpload } from "../hooks/useDndUpload.tsx";

const UploadLink = () => {
  const { onDrop, onDragEnter, onDragLeave, onDragOver, dropRef } =
    useDndUpload<HTMLAnchorElement>();

  return (
    <Link
      to="/upload"
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
