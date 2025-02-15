import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: "tests/01-minimal/globalSetup.ts",
    coverage: {
      enabled: false,
    },
  },
});
