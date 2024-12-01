import type { FC, ReactNode } from "react";
import Header from "./components/Header.tsx";
import Upload from "./components/Upload.tsx";

export default function Index() {
  return (
    <>
      <Header />
      <div className="m-8">
        <Upload />
      </div>
    </>
  );
}