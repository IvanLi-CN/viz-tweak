import { addIconSelectors } from "@iconify/tailwind";
import daisyui from "daisyui";
import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [daisyui, addIconSelectors(["fa"])],
} satisfies Config;
