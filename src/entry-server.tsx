import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { App } from "./App.tsx";
import { normalizePath } from "./lib/paths.ts";

export function render(url: string): string {
  return renderToString(
    <StrictMode>
      <App initialPath={normalizePath(url)} />
    </StrictMode>,
  );
}
