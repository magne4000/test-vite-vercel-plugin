import React from "react";
import { Link } from "./Link";
import logoUrl from "./logo.svg";
import type { PageContext } from "./types";
import { PageContextProvider } from "./usePageContext";

export { PageShell };

function PageShell({
  pageContext,
  children,
}: {
  pageContext: PageContext;
  children: React.ReactNode;
}) {
  return (
    <React.StrictMode>
      <PageContextProvider pageContext={pageContext}>
        <Layout>
          <Sidebar>
            <Logo />
            <Link href="/">Home</Link>
            <Link href="/dynamic">Dynamic</Link>
            <Link href="/static">Static</Link>
            <Link href="/isr">ISR</Link>
            <Link href="/named/id-1">Named</Link>
            <Link href="/catch-all/a/b/c">Catch-all</Link>
            <Link href="/function/a">Function</Link>
            <Link href="/edge">Edge Function endpoint</Link>
            <Link href="/vike-edge">Vike Edge Function endpoint</Link>
            <Link href="/og-edge">Edge OG endpoint</Link>
            <Link href="/og-node">Node OG endpoint</Link>
          </Sidebar>
          <Content>{children}</Content>
        </Layout>
      </PageContextProvider>
    </React.StrictMode>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        maxWidth: 900,
        margin: "auto",
      }}
    >
      {children}
    </div>
  );
}

function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <div
      id="sidebar"
      style={{
        padding: 20,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        lineHeight: "1.8em",
        borderRight: "2px solid #eee",
      }}
    >
      {children}
    </div>
  );
}

function Content({ children }: { children: React.ReactNode }) {
  return (
    <div id="page-container">
      <div
        id="page-content"
        style={{
          padding: 20,
          paddingBottom: 50,
          minHeight: "100vh",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div
      style={{
        marginTop: 20,
        marginBottom: 10,
      }}
    >
      <a href="/">
        <img src={logoUrl} height={64} width={64} alt="Logo" />
      </a>
    </div>
  );
}
