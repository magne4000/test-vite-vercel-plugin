// https://vike.dev/onBeforeRender
export default function onBeforeRender() {
  return {
    pageContext: {
      pageProps: {
        d: String(new Date()),
      },
    },
  };
}
