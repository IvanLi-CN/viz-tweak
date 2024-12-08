import { useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { type FC, useEffect, useMemo } from "react";
import { trpc } from "../helpers/trpc.ts";

type AttachmentHeaderProps = {
  attachment: {
    id: string;
    name: string;
    filename: string;
    slug: string;
    description: string | null;
    generatedAt: unknown;
  };
};

const AttachmentHeader: FC<AttachmentHeaderProps> = ({ attachment }) => {
  const queryClient = useQueryClient();
  const generateMutation = useMutation({
    mutationKey: ["generateAttachmentInfo", attachment.id],
    mutationFn: async () => {
      const result = await trpc.attachments.generateInfo.mutate({
        id: attachment.id,
      });

      queryClient.invalidateQueries({
        queryKey: ["attachment", attachment.id],
      });

      return result;
    },
    scope: {
      id: "attachment-header",
    },
  });

  const { name, description } = useMemo(() => {
    return {
      name: generateMutation.data?.names[0] ?? attachment.name,
      description: generateMutation.data?.description ?? attachment.description,
      slug: generateMutation.data?.slugs[0] ?? attachment.slug,
    };
  }, [generateMutation.data, attachment]);

  useEffect(() => {
    if (!attachment.generatedAt) {
      generateMutation.mutate();
    }
  }, [attachment, generateMutation.mutate]);

  return (
    <header className="mx-8 my-4">
      <div className="flex items-center gap-2">
        <h2
          className={clsx("text-xl", {
            "animate-pulse": generateMutation.isPending,
          })}
        >
          {name}
        </h2>
        <button
          type="button"
          onClick={() => generateMutation.mutate()}
          className={clsx(
            "text-xl font-light btn btn-sm btn-circle",
            "flex items-center justify-center",
            {
              "animate-spin": generateMutation.isPending,
            },
          )}
        >
          <span className="iconify solar--refresh-line-duotone" />
        </button>
      </div>
      <small
        title="Raw filename"
        className={clsx("text-xs", {
          "animate-pulse": generateMutation.isPending,
        })}
      >
        {attachment.filename}
      </small>
      <p
        className={clsx("my-2 font-light", {
          "animate-pulse": generateMutation.isPending,
        })}
      >
        {description}
      </p>
    </header>
  );
};

export default AttachmentHeader;
