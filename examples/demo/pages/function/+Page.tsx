import React from "react";
import { Link } from "../../renderer/Link";

export default function Page(props: { d: string }) {
  return (
    <>
      <h1>Welcome</h1>
      This page is:
      <ul>
        <li>Using a route function</li>
        <li>
          Some pages are static:
          <ul>
            <li>
              <Link href="/function/a">/function/a</Link>
            </li>
          </ul>
        </li>
        <li>
          All other pages are dynamic, e.g.:
          <ul>
            <li>
              <Link href="/function/b">/function/b</Link>
            </li>
            <li>
              <Link href="/function/e/f/g/h/i">/function/e/f/g/h/i</Link>
            </li>
          </ul>
        </li>
        <li>{props.d}</li>
      </ul>
    </>
  );
}
