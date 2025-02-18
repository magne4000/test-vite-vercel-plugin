import path from "node:path";
import { describe } from "vitest";
import { testFs } from "../common/helpers";

describe("fs", () => {
  testFs(path.basename(__dirname), [
    "/functions/api/name/[name].func/.vc-config.json",
    "/functions/api/name/[name].func/index.mjs",
    "/functions/api/page.func/index.mjs",
    "/functions/api/page.func/.vc-config.json",
    "/functions/api/post.func/index.mjs",
    "/functions/api/post.func/.vc-config.json",
    "/functions/edge.func/index.js",
    "/functions/edge.func/.vc-config.json",
    "/functions/og-edge.func/.vc-config.json",
    "/functions/og-edge.func/index.js",
    "/functions/og-edge.func/noto-sans-v27-latin-regular.ttf",
    "/functions/og-edge.func/resvg.wasm",
    "/functions/og-edge.func/yoga.wasm",
    "/functions/og-node.func/.vc-config.json",
    "/functions/og-node.func/Roboto-Regular.ttf",
    "/functions/og-node.func/index.mjs",
    "/functions/og-node.func/noto-sans-v27-latin-regular.ttf",
    "/functions/og-node.func/resvg.wasm",
    "/functions/og-node.func/yoga.wasm",
    "/config.json",
    "/static/index.html",
    "/static/test.html",
  ]);
});
