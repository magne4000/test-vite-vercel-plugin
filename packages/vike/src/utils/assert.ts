// @ts-ignore
import { newError } from "@brillout/libassert";

export function assert(condition: unknown, errorMessage: string): asserts condition {
  if (condition) {
    return;
  }

  const err = newError(`[vike-vercel] ${errorMessage}`, 2);
  throw err;
}
