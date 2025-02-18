import type { Plugin } from "vite";
import { vercelBuildApp } from "vite-plugin-vercel/api";

export function buildAppPlugins(): Plugin {
  return {
    name: "vike-vercel:build-app",
    apply: "build",

    enforce: "post",

    config: {
      order: "post",
      handler() {
        return {
          builder: {
            async buildApp(builder) {
              console.log("BUILDAPP vike-vercel");
              // Build order:
              // client -> ssr -> vercel_client -> vercel_edge -> vercel_node
              await vercelBuildApp(builder, { client: 1, ssr: 2 });
            },
          },
        };
      },
    },
  };
}
