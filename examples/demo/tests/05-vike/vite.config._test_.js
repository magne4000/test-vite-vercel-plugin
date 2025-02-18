import react from "@vitejs/plugin-react";
import ssr from "vike/plugin";
import vercel from "vite-plugin-vercel";

export default {
  mode: "production",
  root: process.cwd(),
  plugins: [
    react(),
    ssr({
      prerender: {
        disableAutoRun: true,
      },
    }),
    vercel(),
  ],
  vercel: {
    rewrites: [],
    additionalEndpoints: [
      {
        source: "endpoints/edge.ts",
        destination: "edge",
        edge: true,
        route: true,
      },
    ],
    expiration: 25,
  },
};
