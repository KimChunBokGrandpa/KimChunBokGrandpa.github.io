import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import path from "path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [svelte({ hot: false })],
  test: {
    setupFiles: ["./src/lib/utils/vitest.setup.ts"],
    exclude: ["e2e/**", "node_modules/**", ".claude/**"],
  },
  resolve: {
    alias: {
      $lib: path.resolve(dirname, "src/lib"),
    },
    conditions: ["browser"],
  },
});
