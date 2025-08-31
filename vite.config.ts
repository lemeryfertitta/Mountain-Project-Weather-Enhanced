import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        script: "src/script.ts",
      },
      output: {
        entryFileNames: "[name].js",
      }
    }
  },
});
