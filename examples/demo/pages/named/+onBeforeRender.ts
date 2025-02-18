import type { PageContextServer } from "vike/types";

// https://vike.dev/onBeforeRender
export default function onBeforeRender(pageContext: PageContextServer) {
  return {
    pageContext: {
      pageProps: {
        d: String(new Date()),
        someId: pageContext.routeParams.someId,
      },
    },
  };
}
