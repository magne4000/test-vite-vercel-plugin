import React from "react";

export default function Page(props: { d: string }) {
  return (
    <>
      <h1>Welcome</h1>
      This page is:
      <ul>
        <li>Static</li>
        <li>Static html generated</li>
        <li>No ISR</li>
        <li>{props.d}</li>
      </ul>
    </>
  );
}
