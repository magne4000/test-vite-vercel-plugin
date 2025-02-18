import path from "node:path";
import { expect, it } from "vitest";
import { vercelOutputPrerenderConfigSchema } from "../../../../packages/vercel/src/schemas/config/prerender-config";
import { prepareTestJsonFileContent, testSchema } from "../common/helpers";

prepareTestJsonFileContent(path.basename(__dirname), "/functions/page1.prerender-config.json", (context) => {
  testSchema(context, vercelOutputPrerenderConfigSchema);

  it("should have only necessary properties", () => {
    expect(Object.keys(context.file as any)).toHaveLength(2);
    expect(context.file).toHaveProperty("expiration", 42);
    expect(context.file).toHaveProperty("group");
    expect((context.file as any).group).toBeTypeOf("number");
  });
});
