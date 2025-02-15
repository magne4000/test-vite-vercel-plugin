import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: "tests/03-prerender/globalSetup.ts",
    coverage: {
      enabled: false,
    },
  },
});
