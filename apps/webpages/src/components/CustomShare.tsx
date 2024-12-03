import { useForm } from "@tanstack/react-form";
import type { FC } from "react";
import { parseFiledToNumber } from "../helpers/form.ts";
import {
  type ShareOptions,
  shareOptionsSchema,
} from "../schemas/share-options.ts";

type ShareOptionsProps = {
  options: ShareOptions;
  onChange?: (values: ShareOptions) => void;
};

const CustomShare: FC<ShareOptionsProps> = ({ options, onChange }) => {
  const form = useForm<ShareOptions>({
    defaultValues: shareOptionsSchema.parse(options),
    onSubmit: ({ value }) => {
      onChange?.(value);
    },
  });

  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        form.handleSubmit();
      }}
      onChange={(ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        form.handleSubmit();
      }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <div className="flex flex-col gap-4">
        <form.Field
          name="width"
          // biome-ignore lint/correctness/noChildrenProp: <explanation>
          children={(field) => {
            return (
              <label className="input input-bordered flex items-center gap-2">
                Width
                <input
                  type="number"
                  step={1}
                  className="grow"
                  placeholder="Width"
                  id={field.name}
                  name={field.name}
                  value={field.state.value ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(ev) =>
                    field.handleChange(parseFiledToNumber(ev.target.value))
                  }
                />
              </label>
            );
          }}
        />
        <form.Field
          name="height"
          // biome-ignore lint/correctness/noChildrenProp: <explanation>
          children={(field) => {
            return (
              <label className="input input-bordered flex items-center gap-2">
                Height
                <input
                  type="number"
                  step={1}
                  className="grow"
                  placeholder="Height"
                  id={field.name}
                  name={field.name}
                  value={field.state.value ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(ev) =>
                    field.handleChange(parseFiledToNumber(ev.target.value))
                  }
                />
              </label>
            );
          }}
        />
      </div>
      <div className="flex flex-col gap-4">
        <form.Field
          name="format"
          // biome-ignore lint/correctness/noChildrenProp: <explanation>
          children={(field) => {
            return (
              <div className="flex flex-row gap-2">
                <label className="input flex items-center gap-2">
                  <input
                    type="radio"
                    className="radio"
                    id={field.name}
                    name={field.name}
                    value="webp"
                    checked={field.state.value === "webp"}
                    onBlur={field.handleBlur}
                    onChange={() => field.handleChange("webp")}
                  />
                  WEBP
                </label>
                <label className="input flex items-center gap-2">
                  <input
                    type="radio"
                    className="radio"
                    id={field.name}
                    name={field.name}
                    value="png"
                    checked={field.state.value === "png"}
                    onBlur={field.handleBlur}
                    onChange={() => field.handleChange("png")}
                  />
                  PNG
                </label>
                <label className="input flex items-center gap-2">
                  <input
                    type="radio"
                    className="radio"
                    id={field.name}
                    name={field.name}
                    value="jpeg"
                    checked={field.state.value === "jpeg"}
                    onBlur={field.handleBlur}
                    onChange={() => field.handleChange("jpeg")}
                  />
                  JPEG
                </label>
              </div>
            );
          }}
        />
        <form.Field
          name="orient"
          // biome-ignore lint/correctness/noChildrenProp: <explanation>
          children={(field) => {
            return (
              <div className="flex flex-row gap-2">
                <label className="input flex items-center gap-2">
                  <input
                    type="radio"
                    className="radio"
                    id={field.name}
                    name={field.name}
                    checked={field.state.value === 0}
                    onBlur={field.handleBlur}
                    onChange={() => field.handleChange(0)}
                  />
                  0°
                </label>
                <label className="input flex items-center gap-2">
                  <input
                    type="radio"
                    className="radio"
                    id={field.name}
                    name={field.name}
                    checked={field.state.value === 90}
                    onBlur={field.handleBlur}
                    onChange={() => field.handleChange(90)}
                  />
                  90°
                </label>
                <label className="input flex items-center gap-2">
                  <input
                    type="radio"
                    className="radio"
                    id={field.name}
                    name={field.name}
                    checked={field.state.value === 180}
                    onBlur={field.handleBlur}
                    onChange={() => field.handleChange(180)}
                  />
                  180°
                </label>
                <label className="input flex items-center gap-2">
                  <input
                    type="radio"
                    className="radio"
                    id={field.name}
                    name={field.name}
                    checked={field.state.value === 270}
                    onBlur={field.handleBlur}
                    onChange={() => field.handleChange(270)}
                  />
                  270°
                </label>
              </div>
            );
          }}
        />
      </div>
      <div className="flex flex-col gap-4">
        <form.Field
          name="fitIn"
          // biome-ignore lint/correctness/noChildrenProp: <explanation>
          children={(field) => {
            return (
              <label className="cursor-pointer label">
                <span className="label-text">Fit in</span>
                <input
                  type="checkbox"
                  className="checkbox"
                  id={field.name}
                  name={field.name}
                  checked={field.state.value === true}
                  onBlur={field.handleBlur}
                  onChange={(ev) => field.handleChange(ev.target.checked)}
                />
              </label>
            );
          }}
        />
        <form.Field
          name="smart"
          // biome-ignore lint/correctness/noChildrenProp: <explanation>
          children={(field) => {
            return (
              <label className="cursor-pointer label">
                <span className="label-text">Smart</span>
                <input
                  type="checkbox"
                  className="checkbox"
                  id={field.name}
                  name={field.name}
                  checked={field.state.value === true}
                  onBlur={field.handleBlur}
                  onChange={(ev) => field.handleChange(ev.target.checked)}
                />
              </label>
            );
          }}
        />
      </div>
    </form>
  );
};

export default CustomShare;
