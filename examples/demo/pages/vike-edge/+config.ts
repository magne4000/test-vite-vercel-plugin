import type { Config } from "vike/types";

export default {
  prerender: false,
  edge: true,
  headers: {
    "X-VitePluginVercel-Test": "test",
  },
} satisfies Config;
