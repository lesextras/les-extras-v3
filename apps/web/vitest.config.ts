import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    exclude: ["node_modules", ".next", "**/*.e2e.*"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "next/cache": path.resolve(__dirname, "./src/__mocks__/next-cache.ts"),
      "next/dynamic": path.resolve(__dirname, "./src/__mocks__/next-dynamic.tsx"),
      "next/headers": path.resolve(__dirname, "./src/__mocks__/next-headers.ts"),
      "next/image": path.resolve(__dirname, "./src/__mocks__/next-image.tsx"),
      "next/link": path.resolve(__dirname, "./src/__mocks__/next-link.tsx"),
      "next/navigation": path.resolve(__dirname, "./src/__mocks__/next-navigation.ts"),
      "next/server": path.resolve(__dirname, "./src/__mocks__/next-server.ts"),
      "server-only": path.resolve(__dirname, "./src/__mocks__/server-only.ts"),
    },
  },
});
