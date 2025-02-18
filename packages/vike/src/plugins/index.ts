import type { Plugin } from "vite";
import { buildAppPlugins } from "./build-app";
import { fixEnvsPlugins } from "./fix-envs";
import { routesPlugin } from "./routes";

export const plugins: Plugin[] = [fixEnvsPlugins(), routesPlugin(), /*routesPluginDev(),*/ buildAppPlugins()];
