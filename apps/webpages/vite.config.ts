import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    server: {
      port: 24114,
      proxy: {
        "/api": {
          target: env.API_URL || "http://localhost:24113",
          changeOrigin: true,
          ws: true,
          timeout: 0,
        },
      },
    },
  };
});
