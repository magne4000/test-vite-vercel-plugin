import path from "node:path";
import { expect, it } from "vitest";
import { vercelOutputConfigSchema } from "../../../../packages/vercel/src/schemas/config/config";
import { prepareTestJsonFileContent, testSchema } from "../common/helpers";

prepareTestJsonFileContent(path.basename(__dirname), "config.json", (context) => {
  testSchema(context, vercelOutputConfigSchema);

  it("should have defaults routes only", () => {
    expect(context.file).toHaveProperty("routes", [
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
        check: true,
        src: "^/edge$",
        dest: "/edge",
      },
      {
        check: true,
        src: "^/og-edge$",
        dest: "/og-edge",
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
        src: "^/og-node$",
        dest: "/og-node",
      },
    ]);
    expect(context.file).toHaveProperty("overrides", {
      "test.html": {
        path: "test",
      },
    });
    expect(Object.keys(context.file as any).sort()).toMatchObject(["version", "overrides", "routes"].sort());
  });
});
