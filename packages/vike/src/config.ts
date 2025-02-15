import type { Config } from "vike/types";

declare global {
  namespace Vike {
    export interface Config {
      isr?: boolean | { expiration: number };
      edge?: boolean;
      headers?: Record<string, string>;
    }
  }
}

export default {
  name: "vike-vercel",
  require: {
    vike: ">=0.4.219",
  },
  meta: {
    isr: {
      env: { server: true },
    },
    edge: {
      env: { server: true },
    },
    headers: {
      env: { server: true },
    },
  },
} satisfies Config;
