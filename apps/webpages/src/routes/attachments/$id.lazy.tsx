import { useQuery } from "@tanstack/react-query";
import { Link, createLazyFileRoute } from "@tanstack/react-router";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";
import CustomShare, {} from "../../components/CustomShare.tsx";
import Header from "../../components/Header.tsx";
import { ShareUrl } from "../../components/ShareUrl.tsx";
import ErrorMessage from "../../components/common/ErrorMessage.tsx";
import Previewer from "../../components/common/Previewer.tsx";
import { trpc } from "../../helpers/trpc.ts";

export const Route = createLazyFileRoute("/attachments/$id")({
  component: RouteComponent,
  errorComponent: ErrorMessage,
});

function RouteComponent() {
  const attachment = Route.useLoaderData();
  const options = Route.useSearch();
  const navigation = Route.useNavigate();

  const [activeTab, setActiveTab] = useState(
    (window.location.hash || "#presets") as "#presets" | "#custom",
  );

  useEffect(() => {
    const handler = () => {
      setActiveTab(window.location.hash === "#custom" ? "#custom" : "#presets");
    };

    window.addEventListener("hashchange", handler);
    return () => {
      window.removeEventListener("hashchange", handler);
    };
  }, []);

  const { data: shareUrl } = useQuery({
    queryKey: ["generateShareUrl", options],
    queryFn: async () => {

      const format = (() => {
        const [type, format] = (attachment.mime ?? "").split("/");

        if (
          type === "image" &&
          !["webp", "png", "jpeg", "gif"].includes(format)
        ) {
          return "webp";
        }

        return options.format;
      })();


      return await trpc.shares.generateUrl.query({
        attachmentId: attachment.id,
        options: {
          ...options,
          format,
        },
      });
    },
  });

  const { data: presets } = useQuery({
    queryKey: ["sharePresets"],
    queryFn: async () => {
      return await trpc.shares.presets.query({
        attachmentId: attachment.id,
      });
    },
  });

  const handleOptionChange = useCallback(
    (options: ReturnType<typeof Route.useSearch>) => {
      navigation({
        replace: true,
        search: options,
        hash: true,
      });
    },
    [navigation],
  );


  return (
    <>
      <Header />
      <div>
        <header className="mx-8 my-4">
          <h2 className="text-xl">{attachment.name}</h2>
          <small>{attachment.filename}</small>
        </header>

        <section>
          <div className="mx-auto my-4">
            <Previewer
              mime={attachment.mime}
              url={shareUrl}
              fallbackUrl={attachment.url}
              className="h-96 m-auto"
            />
          </div>
          <div className="max-w-7xl my-4 mx-auto">
            <nav
              role="tablist"
              className="tabs tabs-bordered my-4 mx-4 md:mx-8 md:w-96"
            >
              <Link
                replace
                hash="presets"
                role="tab"
                search
                className={activeTab === "#presets" ? "tab tab-active" : "tab"}
                onClick={() => setActiveTab("#presets")}
              >
                <span className="iconify solar--backpack-bold-duotone mr-2" />
                Presets
              </Link>
              <Link
                replace
                hash="custom"
                role="tab"
                search
                className={activeTab === "#custom" ? "tab tab-active" : "tab"}
                onClick={() => setActiveTab("#custom")}
              >
                <span className="iconify solar--pen-bold-duotone mr-2" />
                Custom
              </Link>
            </nav>
            <div
              className={clsx("my-4 mx-4 md:mx-8", {
                hidden: activeTab !== "#custom",
              })}
            >
              <CustomShare options={options} onChange={handleOptionChange} />
            </div>
            <ul
              className={clsx(
                "grid grid-cols-1 md:grid-cols-2 gap-4 my-4 mx-4 md:mx-8",
                { hidden: activeTab !== "#presets" },
              )}
            >
              {presets?.map((preset) => {
                return (
                  <li key={preset.name}>
                    <ShareUrl
                      name={preset.name}
                      url={preset.url}
                      options={preset.options}
                      onSelect={() => handleOptionChange(preset.options)}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}

