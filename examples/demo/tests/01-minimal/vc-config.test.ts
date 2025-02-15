import path from "node:path";
import { expect, it } from "vitest";
import { vercelOutputVcConfigSchema } from "../../../../packages/vercel/src/schemas/config/vc-config";
import { prepareTestJsonFilesContent, testSchema } from "../common/helpers";

prepareTestJsonFilesContent(
  path.basename(__dirname),
  ["/functions/api/page.func/.vc-config.json", "/functions/api/post.func/.vc-config.json"],
  (context) => {
    testSchema(context, vercelOutputVcConfigSchema);

    it("should have only necessary properties", () => {
      expect(context.file).toStrictEqual({
        handler: "index.mjs",
        launcherType: "Nodejs",
        runtime: "nodejs22.x",
        shouldAddHelpers: true,
      });
    });
  },
);

prepareTestJsonFilesContent(path.basename(__dirname), ["/functions/edge.func/.vc-config.json"], (context) => {
  testSchema(context, vercelOutputVcConfigSchema);

  it("should have only necessary properties", () => {
    expect(context.file).toStrictEqual({
      runtime: "edge",
      entrypoint: "index.js",
    });
  });
});
