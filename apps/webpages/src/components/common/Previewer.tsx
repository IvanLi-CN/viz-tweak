import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import clsx from "clsx";
import { type FC, useEffect, useState } from "react";

type PreviewerProps = {
  mime?: string | null;
  url?: string;
  fallbackUrl: string;
  style?: React.CSSProperties;
  className?: string;
};

const Previewer: FC<PreviewerProps> = ({
  mime,
  url,
  fallbackUrl,
  ...props
}) => {
  const [size, setSize] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const { data: image, isLoading } = useQuery({
    queryKey: ["preview", url],
    queryFn: async () => {
      if (!url) {
        return null;
      }

      setLoaded(0);

      const res = await axios.get(url, {
        responseType: "blob",
        onDownloadProgress: (e) => {
          setSize(e.total ?? 0);
          setLoaded(e.loaded);
        },
      });

      return res.data;
    },
  });

  const [blobUrl, setBlobUrl] = useState("");
  useEffect(() => {
    if (image) {
      const blob = new Blob([image], { type: mime ?? undefined });
      const blobUrl = URL.createObjectURL(blob);
      setBlobUrl(blobUrl);

      return () => {
        URL.revokeObjectURL(blobUrl);
      };
    }
  }, [image, mime]);

  const [imgSize, setImgSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  return (
    <div
      className={clsx(
        "flex flex-col max-w-full md:max-w-4xl h-full overflow-hidden",
        props.className,
      )}
      style={props.style}
    >
      <div
        className={clsx(
          "bg-base-200 w-full flex items-center flex-auto h-1/2",
          "transition-all duration-500",
          {
            "blur-3xl": isLoading,
          },
          "relative",
        )}
      >
        <img
          src={fallbackUrl}
          aria-label="Preview"
          className={clsx(
            "absolute top-0 left-0 blur-lg transition-opacity duration-300 delay-100",
            isLoading ? "opacity-50" : "opacity-0",
          )}
        />
        <img
          src={blobUrl}
          aria-label="Preview"
          className="block m-auto max-w-full max-h-96 relative"
          onLoad={({ target }) => {
            const img = target as HTMLImageElement;
            setImgSize(
              img.naturalWidth && img.naturalHeight
                ? { width: img.naturalWidth, height: img.naturalHeight }
                : null,
            );
          }}
        />
      </div>

      <div className="text-center bg-base-300 font-light font-mono flex justify-between px-4 py-1">
        {isLoading && size > 0 ? (
          <span className="text-right w-8">
            {`${Math.round((loaded / size) * 100)}%`}
          </span>
        ) : (
          <span>
            {imgSize ? (
              <span>
                {imgSize.width}x{imgSize.height}
              </span>
            ) : null}
          </span>
        )}
        {size > 0 ? (
          <span>
            {new Intl.NumberFormat("en-US", {
              notation: "compact",
              compactDisplay: "short",
            }).format(size)}
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default Previewer;
