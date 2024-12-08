import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { trpc } from "../../helpers/trpc.ts";
import { shareOptionsSchema } from "../../schemas/share-options.ts";

export const Route = createFileRoute("/attachments/$id")({
  loader: ({ context: { queryClient }, params: { id } }) =>
    queryClient.fetchQuery({
      queryKey: ["attachment", id],
      queryFn: () => trpc.attachments.get.query({ id }),
    }),
  validateSearch: zodValidator(shareOptionsSchema),
});
