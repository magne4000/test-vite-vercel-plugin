import vikeVercel from "vike-vercel/config";
import type { Config } from "vike/types";

export default {
  prerender: true,
  viteEnvironmentAPI: true,
  extends: [vikeVercel],
} satisfies Config;
