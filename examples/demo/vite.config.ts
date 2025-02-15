import react from "@vitejs/plugin-react";
import { plugins } from "vike-vercel/plugins";
import vike from "vike/plugin";
import type { UserConfig } from "vite";
import vercel from "vite-plugin-vercel";
import { getEntriesFromFs } from "vite-plugin-vercel/utils";

export default {
  plugins: [
    react(),
    vike(),
    vercel({
      expiration: 25,
      entries: [
        ...(await getEntriesFromFs("_api", {
          destination: "api",
        })),
        ...(await getEntriesFromFs("endpoints", {
          // Auto mapping:
          //   endpoints/edge.ts -> /edge
          //   endpoints/og-node.tsx -> /og-node
          //   endpoints/og-edge.tsx -> /og-edge
          destination: "",
        })),
      ],
    }),
    plugins,
  ],
  // We manually add a list of dependencies to be pre-bundled, in order to avoid a page reload at dev start which breaks vike's CI
  // Also, react ones are here to fix issues while loading CJS
  optimizeDeps: { include: ["cross-fetch", "react/jsx-runtime", "react/jsx-dev-runtime"] },
} as UserConfig;
