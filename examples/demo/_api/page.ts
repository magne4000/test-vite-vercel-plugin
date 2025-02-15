export const headers = {
  "X-VitePluginVercel-Test": "test",
};

// This is a Universal Handler
// See https://universal-middleware.dev/definitions#handler
export default async function handler(request: Request) {
  return new Response("OK");
}
