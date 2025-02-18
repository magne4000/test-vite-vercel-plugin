import type { EnvironmentOptions, Plugin } from "vite";

function setTargetAndCssTarget(env: EnvironmentOptions) {
  env.build ??= {};
  env.build.target = "es2022";
  env.build.cssTarget = "es2022";
}

export function fixEnvsPlugins(): Plugin {
  return {
    name: "vike-vercel:fix-envs",
    apply: "build",

    configEnvironment(name, options) {
      if (name === "vercel_client" || name === "client") {
        setTargetAndCssTarget(options);
      }
    },
  };
}
