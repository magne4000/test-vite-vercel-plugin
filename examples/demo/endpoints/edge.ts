import { createClient } from "@vercel/edge-config";

export const edge = true;

export default async function handler() {
  if (import.meta.env.NODE_ENV === "development" && !import.meta.env.EDGE_CONFIG) {
    throw new Error(
      "Please add EDGE_CONFIG in .env.development.local. See https://vercel.com/docs/storage/edge-config/using-edge-config",
    );
  }
  const edgeConfig = createClient(import.meta.env.EDGE_CONFIG);
  await edgeConfig.get("someKey");

  return new Response("Edge Function: OK", {
    status: 200,
  });
}
