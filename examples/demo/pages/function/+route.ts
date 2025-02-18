export function route(pageContext: any) {
  if (!pageContext.urlPathname.startsWith("/function/")) return false;
  return {
    precedence: -1,
  };
}
