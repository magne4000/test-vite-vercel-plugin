import type { RuntimeAdapter } from '@universal-middleware/core'

// This is a Universal Handler
// See https://universal-middleware.dev/definitions#handler
export default async function handler(request: Request, context: Universal.Context, runtime: RuntimeAdapter) {
  return new Response(`Name: ${runtime.params?.name}`);
}
