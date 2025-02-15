import path from "node:path";
import glob from "fast-glob";
import { describe, expect, it } from "vitest";

describe("fs", () => {
  const buildManifest = require("../../dist/assets.json");

  const generatedFiles = Array.from(
    new Set(
      Object.values(buildManifest)
        .filter((e: any): e is any => Boolean(e.file))
        .flatMap((e) => [e.file, ...(e.assets ?? []), ...(e.css ?? [])])
        .filter((f) => f.startsWith("assets/")),
    ),
  );

  const expected = [
    "/config.json",
    "/functions/api/name/[name].func/.vc-config.json",
    "/functions/api/name/[name].func/index.mjs",
    "/functions/api/page.func/index.mjs",
    "/functions/api/page.func/.vc-config.json",
    "/functions/api/post.func/index.mjs",
    "/functions/api/post.func/.vc-config.json",
    "/functions/edge.func/index.js",
    "/functions/edge.func/.vc-config.json",
    "/functions/og-node.func/index.mjs",
    "/functions/og-node.func/.vc-config.json",
    "/functions/og-node.func/noto-sans-v27-latin-regular.ttf",
    "/functions/og-node.func/Roboto-Regular.ttf",
    "/functions/og-node.func/resvg.wasm",
    "/functions/og-node.func/yoga.wasm",
    "/functions/og-edge.func/index.js",
    "/functions/og-edge.func/.vc-config.json",
    "/functions/og-edge.func/noto-sans-v27-latin-regular.ttf",
    "/functions/og-edge.func/resvg.wasm",
    "/functions/og-edge.func/yoga.wasm",
    // ISR + Static pages
    "/functions/ssr_.func/index.mjs",
    "/functions/ssr_.func/.vc-config.json",
    "/static/404.html",
    "/static/index.html",
    "/static/index.pageContext.json",
    "/static/static/index.html",
    "/static/static/index.pageContext.json",
    "/static/catch-all/a/b/c/index.html",
    "/static/catch-all/a/b/c/index.pageContext.json",
    "/static/catch-all/a/d/index.html",
    "/static/catch-all/a/d/index.pageContext.json",
    "/static/function/a/index.html",
    "/static/function/a/index.pageContext.json",
    "/static/named/id-1/index.html",
    "/static/named/id-1/index.pageContext.json",
    "/static/named/id-2/index.html",
    "/static/named/id-2/index.pageContext.json",
    "/static/test.html",
    /\/functions\/pages\/catch-all-([^\/]+?)\.prerender-config\.json/,
    /\/functions\/pages\/catch-all-([^\/]+?)\.func\/index\.mjs/,
    /\/functions\/pages\/catch-all-([^\/]+?)\.func\/\.vc-config\.json/,
    /\/functions\/pages\/isr-([^\/]+?)\.prerender-config\.json/,
    /\/functions\/pages\/isr-([^\/]+?)\.func\/index\.mjs/,
    /\/functions\/pages\/isr-([^\/]+?)\.func\/\.vc-config\.json/,
    /\/functions\/pages\/named-([^\/]+?)\.prerender-config\.json/,
    /\/functions\/pages\/named-([^\/]+?)\.func\/index\.mjs/,
    /\/functions\/pages\/named-([^\/]+?)\.func\/\.vc-config\.json/,
    // vike-edge
    /\/functions\/pages\/vike-edge-edge-([^\/]+?)\.func\/index\.js/,
    /\/functions\/pages\/vike-edge-edge-([^\/]+?)\.func\/\.vc-config\.json/,
    ...generatedFiles.map((f) => `/static/${f}`),
  ];

  it("should generate the right files", async () => {
    const dir = path.join(__dirname, "../../.vercel/output");
    const entries = await glob(`${dir}/**`, { dot: true });
    let mappedEntries = entries.map((e) => e.replace(dir, "")).filter((e) => !e.startsWith("/_ignore"));

    mappedEntries = Array.from(new Set(mappedEntries));

    expect(entries).toHaveLength(expected.length);
    for (const entry of mappedEntries) {
      expect(entry).toSatisfy((elt: string) => {
        for (const exp of expected) {
          if (typeof exp === "string") {
            if (exp === elt) return true;
          } else {
            const match = elt.match(exp);
            if (match) return true;
          }
        }
        console.error("no match found for", elt);
        return false;
      });
    }
  });
});
