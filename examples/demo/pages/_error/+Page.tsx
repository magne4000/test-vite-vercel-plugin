import type React from "react";
import { usePageContext } from "../../renderer/usePageContext";

export default function Page() {
  const ctx = usePageContext();
  let { is404, abortReason } = ctx;
  if (!abortReason) {
    abortReason = is404 ? "Page not found." : "Something went wrong.";
  }
  return (
    <Center>
      <p style={{ fontSize: "1.3em" }}>{abortReason}</p>
    </Center>
  );
}

function Center({ style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        height: "calc(100vh - 100px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        ...style,
      }}
      {...props}
    />
  );
}
