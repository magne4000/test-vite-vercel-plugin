import type { PageContextBuiltInServer } from "vike/types";

export default function (pageContext: PageContextBuiltInServer) {
  if (!pageContext.urlPathname.startsWith("/function/")) return false;
  return {
    precedence: -1,
  };
}
