import vikeVercel from "vike-vercel/config";
import type { Config } from "vike/types";

console.log("vikeVercel", vikeVercel);

export default {
  prerender: true,
  viteEnvironmentAPI: true,
  extends: [vikeVercel],
} satisfies Config;
