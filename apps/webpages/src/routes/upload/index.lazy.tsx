import { createLazyFileRoute } from "@tanstack/react-router";
import Header from "../../components/Header.tsx";
import Upload from "../../components/Upload.tsx";

export const Route = createLazyFileRoute("/upload/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <Header />
      <div className="m-8">
        <Upload />
      </div>
    </>
  );
}
