import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: "tests/04-isr/globalSetup.ts",
    coverage: {
      enabled: false,
    },
  },
});
