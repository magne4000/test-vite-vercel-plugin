import type { Plugin } from "vite";
import { fixEnvsPlugins } from "./fix-envs";
import { routesPlugin } from "./routes";
import { buildAppPlugins } from "./build-app";

export const plugins: Plugin[] = [fixEnvsPlugins(), routesPlugin(), buildAppPlugins()];
