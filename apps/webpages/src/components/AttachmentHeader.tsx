import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import clsx from "clsx";
import { type FC, useEffect, useMemo, useState } from "react";
import { z } from "zod";
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

const formDataSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  slug: z.string(),
});

type FormData = z.infer<typeof formDataSchema>;

const AttachmentHeader: FC<AttachmentHeaderProps> = ({ attachment }) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [editing, setEditing] = useState(false);

  const generateMutation = useMutation({
    mutationKey: ["generateAttachmentInfo", attachment.id],
    mutationFn: async () => {
      const result = await trpc.attachments.generateInfo.mutate({
        id: attachment.id,
      });

      queryClient
        .refetchQueries({
          queryKey: ["attachment", attachment.id],
        })
        .then(() => {
          router.invalidate();
        });

      return result;
    },
    scope: {
      id: "attachment-header",
    },
  });
  const saveMutation = useMutation({
    mutationKey: ["saveAttachmentInfo", attachment.id],
    mutationFn: async (data: FormData) => {
      await trpc.attachments.updateInfo.mutate({
        id: attachment.id,
        ...data,
      });
    },
    onSuccess: () => {
      setEditing(false);
      queryClient
        .refetchQueries({
          queryKey: ["attachment", attachment.id],
        })
        .then(() => {
          router.invalidate();
        });
    },
    scope: {
      id: "attachment-header",
    },
  });

  const { name, description } = useMemo(() => {
    return {
      name: attachment.name,
      description: attachment.description,
      slug: attachment.slug,
    };
  }, [attachment]);

  useEffect(() => {
    if (!attachment.generatedAt) {
      generateMutation.mutate();
    }
  }, [attachment, generateMutation.mutate]);

  const form = useForm<FormData>({
    defaultValues: {
      name,
      description,
      slug: attachment.slug,
    },
    onSubmit: ({ value }) => saveMutation.mutateAsync(value),
  });

  if (editing) {
    return (
      <header className="mx-8 my-4">
        <form
          className="grid gap-4"
          style={{
            gridTemplateColumns: "auto 1fr",
          }}
          onSubmit={(ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            form.handleSubmit();
          }}
          onPaste={(ev) => {
            ev.stopPropagation();
          }}
        >
          <form.Field
            name="name"
            // biome-ignore lint/correctness/noChildrenProp: <explanation>
            children={(field) => (
              <>
                <label className="text-xl font-light grid grid-cols-subgrid col-span-2 items-center">
                  <span className="col-start-1 justify-self-end">Name</span>
                  <div className="col-start-2 flex gap-2 items-center">
                    <input
                      onChange={(ev) => {
                        field.handleChange(ev.target.value);
                      }}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      readOnly={saveMutation.isPending}
                      className="input input-ghost input-sm max-w-lg"
                    />
                    <button
                      type="submit"
                      disabled={saveMutation.isPending}
                      className={clsx(
                        "text-xl font-light btn btn-sm btn-circle btn-primary",
                        {
                          "animate-ping": saveMutation.isPending,
                        },
                      )}
                    >
                      <span className="iconify iconoir--save-floppy-disk" />
                    </button>
                  </div>
                </label>
              </>
            )}
          />
          <form.Field
            name="description"
            // biome-ignore lint/correctness/noChildrenProp: <explanation>
            children={(field) => (
              <label className="text-xl font-light grid grid-cols-subgrid col-span-2 items-center">
                <span className="col-start-1 justify-self-end">
                  Description
                </span>
                <textarea
                  onChange={(ev) => {
                    field.handleChange(ev.target.value);
                  }}
                  value={field.state.value ?? ""}
                  onBlur={field.handleBlur}
                  readOnly={saveMutation.isPending}
                  className="input col-start-2 resize-y w-full min-h-8 h-10 max-h-64"
                />
              </label>
            )}
          />
        </form>
      </header>
    );
  }

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
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xl font-light btn btn-sm btn-circle"
          disabled={generateMutation.isPending}
        >
          <span className="iconify iconoir--edit-pencil" />
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
