import { Link } from "@tanstack/react-router";
import type { TRPCClientError } from "@trpc/client";
import type { FC } from "react";
import type { AppRouter } from "viz-tweak-server/src/trpc/trpc.ts";

type ErrorProps = {
  error?: TRPCClientError<AppRouter> | Error;
};
const ErrorMessage: FC<ErrorProps> = ({ error }) => {
  console.error(error);

  return (
    <>
      <div className="hero bg-base-200 min-h-screen">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h2 className="text-3xl font-bold">Something went wrong</h2>
            <p className="py-6 text-error">
              <span className="sr-only">Error:</span>
              <span>{error?.message}</span>
            </p>
            <Link href="/" className="btn btn-primary">
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ErrorMessage;