import { getPagesAndRoutes, type PageRoutes } from "vike/__internal";
import type { PrerenderContextPublic } from "vike/types";
import { normalizePath, type Plugin } from "vite";
import { getAPI } from "vite-plugin-vercel/api";
import { assert } from "../utils/assert";

export function routesPlugin(): Plugin {
  let vikePrerenderContext: PrerenderContextPublic | undefined = undefined;
  let vikePages: {
    pageId: string;
    filePath: string;
    isr: number | null;
    edge: null | boolean;
    headers: Record<string, string> | null;
    route: string | null;
  }[] = [];
  let i = 0;

  return {
    name: "vike-vercel:routes",

    closeBundle: {
      order: "post",
      async handler() {
        if (this.environment.name === "ssr") {
          vikePrerenderContext = this.environment.config.vike?.prerenderContext;
          const { allPageIds, pageRoutes, pageConfigs } = await getPagesAndRoutes();

          vikePages = await Promise.all(
            allPageIds.map(async (pageId) => {
              const pageConfig = pageConfigs.find((p) => p.pageId === pageId);

              assert(
                pageConfig,
                `Cannot find page config ${pageId}. Contact the vite-plugin-vercel maintainer on GitHub / Discord`,
              );

              const simplePageConfig: Record<string, unknown> = {};

              for (const [k, v] of Object.entries(pageConfig.configValues)) {
                simplePageConfig[k] = v.value;
              }

              const page = {
                config: simplePageConfig,
                filePath: pageConfig.pageId,
              };

              const _route = getRouteDynamicRoute(pageRoutes, pageId) ?? getRouteFsRoute(pageRoutes, pageId);
              const rawIsr = extractIsr(page.config);
              let isr = assertIsr(page.config);
              const edge = assertEdge(page.config);
              const headers = assertHeaders(page.config);

              // if ISR + Function routing -> warn because ISR is not unsupported in this case
              if (typeof _route === "function" && isr) {
                console.warn(
                  `Page ${pageId}: ISR is not supported when using route function. Remove \`{ isr }\` config or use a route string if possible.`,
                );
                isr = null;
              }

              if (edge && rawIsr !== null && typeof rawIsr === "object") {
                throw new Error(
                  `Page ${pageId}: ISR cannot be enabled for edge functions. Remove \`{ isr }\` config or set \`{ edge: false }\`.`,
                );
              }

              const route = typeof _route === "string" ? getParametrizedRoute(_route) : null;

              if (!route && headers !== null && headers !== undefined) {
                console.warn(
                  `Page ${pageId}: headers is not supported when using route function. Remove \`{ headers }\` config or use a route string if possible.`,
                );
              }

              return {
                pageId,
                // used for debug purpose
                filePath: page.filePath,
                isr,
                edge,
                headers,
                route,
              };
            }),
          );
        }
      },
    },

    buildStart: {
      order: "post",
      handler() {
        if (this.environment.name !== "vercel_node" && this.environment.name !== "vercel_edge") return;
        const isEdge = this.environment.name === "vercel_edge";
        const key = isEdge ? "__vike_edge" : "__vike_node";

        const { emitVercelEntry } = getAPI(this);
        // By default, a unique Vike function is necessary per env (node, edge)
        // We only need to create a new function when either `isr` or `headers` is provided
        const currentEnvPages = vikePages.filter((p) => Boolean(p.edge) === isEdge);

        // Specific routes
        for (const page of currentEnvPages.filter(
          (p) => p.isr || (p.route && p.headers !== null && p.headers !== undefined),
        )) {
          // console.log("EMIT", this.environment.name, page);
          emitVercelEntry({
            input: `vike/universal-middleware?i=${i++}`,
            destination: normalizePath(`${key}/${page.pageId}`),
            isr: page.isr ? { expiration: page.isr } : undefined,
            headers: page.headers,
            route: page.route ? `${page.route}(?:\\/index\\.pageContext\\.json)?` : undefined,
            edge: isEdge,
          });
        }

        if (currentEnvPages.length > 0) {
          // console.log("EMIT", this.environment.name, "DEFAULT");
          // Catch-all
          emitVercelEntry({
            input: `vike/universal-middleware?i=${i++}`,
            destination: normalizePath(`${key}/__all`),
            route: ".*",
            edge: isEdge,
          });
        }

        // console.log("PAGES", this.environment.name, vikePages);

        // console.log(
        //   "vikePrerenderContext",
        //   this.environment.name,
        //   vikePrerenderContext?.pageContexts.map((x) => ({
        //     pageId: x.pageId,
        //     config: x.config,
        //     configEntries: x.configEntries,
        //   })),
        // );
      },
    },

    sharedDuringBuild: true,
  };
}

function getRouteDynamicRoute(pageRoutes: PageRoutes, pageId: string) {
  for (const route of pageRoutes) {
    if (route.pageId === pageId) {
      if (route.routeType === "STRING") {
        return getParametrizedRoute(route.routeString);
      }
      if (route.routeType === "FUNCTION") {
        // route.routeType === 'FUNCTION'
        return () => {};
      }
    }
  }

  return null;
}

function getRouteFsRoute(pageRoutes: PageRoutes, pageId: string) {
  for (const route of pageRoutes) {
    if (route.pageId === pageId && route.routeType === "FILESYSTEM") {
      return route.routeString;
    }
  }

  return null;
}

function extractIsr(exports: unknown) {
  if (exports === null || typeof exports !== "object") return null;
  if (!("isr" in exports)) return null;
  const isr = (exports as { isr: unknown }).isr;

  assert(
    typeof isr === "object" &&
      typeof (isr as Record<string, unknown>).expiration === "number" &&
      (
        isr as {
          expiration: number;
        }
      ).expiration > 0,
    " `{ expiration }` must be a positive number",
  );

  return isr;
}

function assertIsr(exports: unknown): number | null {
  const isr = extractIsr(exports);
  if (isr === null || isr === undefined) return null;

  return (
    isr as {
      expiration: number;
    }
  ).expiration;
}

function assertEdge(exports: unknown): boolean | null {
  if (exports === null || typeof exports !== "object") return null;
  if (!("edge" in exports)) return null;
  const edge = (exports as { edge: unknown }).edge;

  assert(typeof edge === "boolean", " `{ edge }` must be a boolean");

  return edge;
}

function assertHeaders(exports: unknown): Record<string, string> | null {
  if (exports === null || typeof exports !== "object") return null;
  if (!("headers" in exports)) return null;
  const headers = (exports as { headers: unknown }).headers;

  if (headers === null || headers === undefined) {
    return null;
  }

  assert(typeof headers === "object", " `{ headers }` must be an object");

  for (const value of Object.values(headers)) {
    assert(typeof value === "string", " `{ headers }` must only contains string values");
  }

  return headers as Record<string, string>;
}

function getSegmentRegex(segment: string): string {
  if (segment.startsWith("@")) {
    return "/[^/]+";
  }
  if (segment === "*") {
    return "/.+?";
  }
  return `/${segment}`;
}

export function getParametrizedRoute(route: string): string {
  const segments = (route.replace(/\/$/, "") || "/").slice(1).split("/");
  return segments.map(getSegmentRegex).join("");
}
