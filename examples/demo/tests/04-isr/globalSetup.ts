import path from "node:path";
import { setup as _setup } from "../common/setup";
import { teardown as _teardown } from "../common/teardown";
import react from "@vitejs/plugin-react";
import vercel from "vite-plugin-vercel";

export const setup = _setup(path.basename(__dirname), {
  configFile: false,
  mode: "production",
  root: process.cwd(),
  plugins: [
    react(),
    vercel({
      smart: false,
    }),
  ],
  vercel: {
    isr: {
      page1: {
        expiration: 42,
        route: "/page1",
        symlink: "api/page",
      },
    },
  },
});

export const teardown = _teardown(path.basename(__dirname));
