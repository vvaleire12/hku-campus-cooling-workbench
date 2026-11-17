import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
export default defineConfig(({ mode }) => {
  const standalone = mode === "standalone";
  return {
    base: "./",
    plugins: [react(), ...(standalone ? [viteSingleFile()] : [])],
    build: {
      outDir: standalone ? "dist-html" : "dist",
      ...(standalone
        ? {}
        : {
            rollupOptions: {
              output: {
                manualChunks: {
                  charts: ["recharts"],
                  react: ["react", "react-dom", "react-router-dom"],
                },
              },
            },
          }),
    },
  };
});
