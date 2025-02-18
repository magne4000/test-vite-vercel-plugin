import path from "node:path";
import { setup as _setup } from "../common/setup";
import { teardown as _teardown } from "../common/teardown";
import react from "@vitejs/plugin-react";
import vercel from "vite-plugin-vercel";
import { getTmpDir } from "../common/utils";
import vike from "vike/plugin";
import { getEntriesFromFs } from "vite-plugin-vercel/utils";

const dirname = path.basename(__dirname);

export const setup = _setup(dirname, {
  configFile: false,
  mode: "production",
  root: process.cwd(),
  plugins: [
    react(),
    vike(),
    vercel({
      outDir: getTmpDir(dirname),
      entries: [
        ...(await getEntriesFromFs("_api", {
          // Auto mapping:
          //   _api/page.ts -> /api/page
          //   _api/post.ts -> /api/post
          //   _api/name/[name].ts -> /api/name/*
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
  ],
});

export const teardown = _teardown(dirname);
