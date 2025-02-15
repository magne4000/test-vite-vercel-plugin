import path from "node:path";
import { expect, it } from "vitest";
import { vercelOutputVcConfigSchema } from "../../../../packages/vercel/src/schemas/config/vc-config";
import { testSchema } from "../common/helpers";
import { prepareTestJsonFilesContent } from "./utils";

prepareTestJsonFilesContent(
  [
    "/functions/api/page.func/.vc-config.json",
    "/functions/api/post.func/.vc-config.json",
    "/functions/ssr_.func/.vc-config.json",
    "/functions/pages/catch-all-*.func/.vc-config.json",
    "/functions/pages/isr-*.func/.vc-config.json",
    "/functions/pages/named-*.func/.vc-config.json",
  ],
  (context) => {
    testSchema(context, vercelOutputVcConfigSchema);

    it("should have only necessary properties", () => {
      expect(context.file).toStrictEqual({
        handler: "index.mjs",
        launcherType: "Nodejs",
        runtime: "nodejs20.x",
        shouldAddHelpers: true,
        supportsResponseStreaming: true,
      });
    });
  },
);

prepareTestJsonFilesContent(["/functions/edge.func/.vc-config.json"], (context) => {
  testSchema(context, vercelOutputVcConfigSchema);

  it("should have only necessary properties", () => {
    expect(context.file).toStrictEqual({
      runtime: "edge",
      entrypoint: "index.js",
    });
  });
});
