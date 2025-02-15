import type { PageContextBuiltInServer } from "vike/types";

// https://vike.dev/onBeforeRender
export default function onBeforeRender(pageContext: PageContextBuiltInServer) {
  return {
    pageContext: {
      pageProps: {
        d: String(new Date()),
        someId: pageContext.routeParams.someId,
      },
    },
  };
}
