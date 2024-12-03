import { isEmpty, isNil } from "ramda";

export const parseFiledToNumber = (value: string | undefined | null) => {
  if (isNil(value)) {
    return undefined;
  }
  const text = value.trim();

  if (isEmpty(text)) {
    return undefined;
  }

  return Number.parseInt(value, 10);
};
