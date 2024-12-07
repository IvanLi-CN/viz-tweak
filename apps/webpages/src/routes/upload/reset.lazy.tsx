import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useUpload } from "../../hooks/useUpload.tsx";

export const Route = createLazyFileRoute("/upload/reset")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const createAttachment = useUpload();

  createAttachment(undefined);

  navigate({
    replace: true,
    to: "/upload",
  });

  return null;
}
