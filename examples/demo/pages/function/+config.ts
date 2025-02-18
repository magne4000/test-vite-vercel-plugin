import type { Config } from "vike/types";

export default {
  // Should warn when building because it's incompatible with route function
  isr: { expiration: 15 },
} satisfies Config;
