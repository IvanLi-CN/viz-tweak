import clsx from "clsx";
import { type FC, useState } from "react";
import type { ShareOptions } from "../schemas/share-options.ts";

type ShareUrlProps = {
  name: string;
  url: string;
  options: ShareOptions;
  onSelect?: () => void;
};

export const ShareUrl: FC<ShareUrlProps> = ({
  name,
  url,
  options,
  onSelect,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={clsx(
        "p-2 md:p-4 rounded-box block cursor-pointer",
        "bg-base-300 shadow-md hover:bg-base-200 transition-colors duration-300",
      )}
      onKeyDown={() => {}}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{name}</span>
        <span className="text-xs">
          {options.width && options.height && (
            <span>
              {options.width}x{options.height}
            </span>
          )}
          {options.format && (
            <span className="ml-1 uppercase font-mono">{options.format}</span>
          )}
        </span>
      </div>
      <div className="flex items-center mt-1">
        <input
          type="text"
          readOnly
          value={url}
          className="flex-1 bg-base-100 rounded-lg border-none focus:outline-none px-2 py-1 text-sm"
          onClick={(ev) => (ev.target as HTMLInputElement).select()}
        />
        <button
          type="button"
          onClick={handleCopy}
          className={clsx(
            "btn btn-sm flex items-center px-2 py-1 rounded-md",
            copied ? "btn-success" : "btn-ghost",
          )}
        >
          <span className="iconify solar--copy-bold-duotone text-lg" />
        </button>
      </div>
    </div>
  );
};
