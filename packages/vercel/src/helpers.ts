import path from "node:path";
import { normalizePath, type ResolvedConfig, type UserConfig } from "vite";

/**
 * TODO TO REMOVE
 * @deprecated
 */
export function getRoot(config: UserConfig | ResolvedConfig): string {
  return normalizePath(config.root || process.cwd());
}

/**
 * TODO TO REMOVE
 * @deprecated
 */
export function getOutput(
  config: ResolvedConfig,
  suffix?: "functions" | `functions/${string}.func` | "static",
): string {
  return path.join(getRoot(config), config.build.outDir ?? ".vercel/output", suffix ?? "");
}

/**
 * TODO TO REMOVE
 * @deprecated
 */
export function getPublic(config: ResolvedConfig): string {
  return path.join(getRoot(config), config.publicDir || "public");
}
