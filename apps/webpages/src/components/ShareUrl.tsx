import clsx from "clsx";
import { type FC, useState } from "react";
import type { ShareOptions } from "../schemas/share-options.ts";

type ShareUrlProps = {
  attachmentName: string;
  name: string;
  url: string;
  options: ShareOptions;
  onSelect?: () => void;
};

export const ShareUrl: FC<ShareUrlProps> = ({
  attachmentName,
  name,
  url,
  options,
  onSelect,
}) => {
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
      <InputCopy value={url} />
      <InputCopy value={`![${attachmentName}](${url})`} />
    </div>
  );
};

const InputCopy: FC<{ value: string }> = ({ value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center mt-1">
      <div className="flex-1">
        <input
          type="text"
          readOnly
          value={value}
          className="w-full bg-base-100 rounded-lg border-none focus:outline-none px-2 py-1 text-sm"
          onClick={(ev) => (ev.target as HTMLInputElement).select()}
        />
      </div>
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
  );
};
