import React from "react";

export default function Page(props: { d: string }) {
  return (
    <>
      <h1>Welcome</h1>
      This page is:
      <ul>
        <li>Dynamic</li>
        <li>No static html generated</li>
        <li>No ISR</li>
        <li>{props.d}</li>
      </ul>
    </>
  );
}
