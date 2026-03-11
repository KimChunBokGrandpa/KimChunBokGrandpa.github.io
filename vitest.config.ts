import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./src/lib/utils/vitest.setup.ts"],
    exclude: ["e2e/**", "node_modules/**", ".claude/**"],
  },
});
