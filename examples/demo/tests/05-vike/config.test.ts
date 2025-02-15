import { expect, it } from "vitest";
import { vercelOutputConfigSchema } from "../../../../packages/vercel/src/schemas/config/config";
import { testSchema } from "../common/helpers";
import { prepareTestJsonFileContent } from "./utils";

prepareTestJsonFileContent("config.json", (context) => {
  testSchema(context, vercelOutputConfigSchema);

  it("should have defaults routes only", () => {
    const expected = [
      {
        src: "^/vike-edge$",
        headers: {
          "X-VitePluginVercel-Test": "test",
        },
        continue: true,
      },
      {
        src: "^/vike-edge/index\\.pageContext\\.json$",
        headers: {
          "X-VitePluginVercel-Test": "test",
        },
        continue: true,
      },
      {
        src: "^/api/page$",
        headers: { "X-VitePluginVercel-Test": "test" },
        continue: true,
      },
      {
        headers: { Location: "/$1" },
        src: "^/(?:(.+)/)?index(?:\\.html)?/?$",
        status: 308,
      },
      {
        headers: { Location: "/$1" },
        src: "^/(.*)\\.html/?$",
        status: 308,
      },
      { handle: "filesystem" },
      {
        src: "^/edge(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?$",
        dest: "/edge/$1",
        check: true,
      },
      {
        src: "^/og-node(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?$",
        dest: "/og-node/$1",
        check: true,
      },
      {
        src: "^/og-edge(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?$",
        dest: "/og-edge/$1",
        check: true,
      },
      {
        src: "^(/vike-edge(?:/index\\.pageContext\\.json)?)$",
        dest: expect.stringMatching("/pages/vike-edge-edge-([^/]+?)/\\?__original_path=\\$1"),
        check: true,
      },
      {
        check: true,
        src: "^/api/page$",
        dest: "/api/page",
      },
      {
        check: true,
        src: "^/api/post$",
        dest: "/api/post",
      },
      {
        check: true,
        src: "^/api/name(?:/([^/]+?))$",
        dest: "/api/name/[name]?name=$1",
      },
      {
        check: true,
        src: "^(/catch-all/.+?(?:/index\\.pageContext\\.json)?)$",
        dest: expect.stringMatching("/pages/catch-all-([^/]+?)/\\?__original_path=\\$1"),
      },
      {
        check: true,
        src: "^(/isr(?:/index\\.pageContext\\.json)?)$",
        dest: expect.stringMatching("/pages/isr-([^/]+?)/\\?__original_path=\\$1"),
      },
      {
        check: true,
        src: "^(/named/[^/]+(?:/index\\.pageContext\\.json)?)$",
        dest: expect.stringMatching("/pages/named-([^/]+?)/\\?__original_path=\\$1"),
      },
      { check: true, dest: "/ssr_/?__original_path=$1", src: "^((?!/api).*)$" },
    ];

    expect((context.file as any).routes).toHaveLength(expected.length);
    for (const route of expected) {
      expect((context.file as any).routes).toContainEqual(route);
    }
    expect((context.file as any).overrides).toMatchObject({
      // '404.html': {
      //   path: '404',
      // },
      "catch-all/a/b/c/index.html": {
        path: "catch-all/a/b/c",
      },
      "catch-all/a/d/index.html": {
        path: "catch-all/a/d",
      },
      "function/a/index.html": {
        path: "function/a",
      },
      "index.html": {
        path: "",
      },
      "named/id-1/index.html": {
        path: "named/id-1",
      },
      "named/id-2/index.html": {
        path: "named/id-2",
      },
      "static/index.html": {
        path: "static",
      },
    });
    expect(Object.keys(context.file as any).sort()).toEqual(["version", "overrides", "routes"].sort());
  });
});
