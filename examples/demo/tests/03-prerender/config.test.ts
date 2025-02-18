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
        src: "^/edge(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))?$",
        dest: "/edge/$1",
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
    ]);
    expect(context.file).toHaveProperty("overrides", {
      ssr: { path: "ssr_" },
    });
    expect(Object.keys(context.file as any).sort()).toEqual(["version", "overrides", "routes"].sort());
  });
});
