import React from "react";

export default function Page(props: { d: string }) {
  return (
    <>
      <h1>Welcome</h1>
      This page is:
      <ul>
        <li>ISR</li>
        <li>ISR: regenerated after {15} seconds</li>
        <li>{props.d}</li>
      </ul>
    </>
  );
}
