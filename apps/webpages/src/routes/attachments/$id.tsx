import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { shareOptionsSchema } from "../../schemas/share-options.ts";

export const Route = createFileRoute("/attachments/$id")({
  loader: ({ context: { trpc }, params: { id } }) =>
    trpc.attachments.get.query({ id }),
  validateSearch: zodValidator(shareOptionsSchema),
});
