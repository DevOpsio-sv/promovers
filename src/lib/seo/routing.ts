export type PublicPage = "/" | "/privacy" | "/cookies";

export interface ResolvedPage {
  page: PublicPage;
  asset: string;
}

const PAGES: Record<string, ResolvedPage> = {
  "/": { page: "/", asset: "/index.html" },
  "/index.html": { page: "/", asset: "/index.html" },
  "/privacy": { page: "/privacy", asset: "/privacy/index.html" },
  "/privacy/index.html": { page: "/privacy", asset: "/privacy/index.html" },
  "/cookies": { page: "/cookies", asset: "/cookies/index.html" },
  "/cookies/index.html": { page: "/cookies", asset: "/cookies/index.html" },
};

export function normalizePath(pathname: string): PublicPage | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/index.html") return "/";
  if (path === "/privacy/index.html") return "/privacy";
  if (path === "/cookies/index.html") return "/cookies";
  if (path === "/" || path === "/privacy" || path === "/cookies") return path;
  return null;
}

export function resolvePage(pathname: string): ResolvedPage | "asset" | "not-found" {
  const path = pathname.replace(/\/+$/, "") || "/";
  const page = PAGES[path];
  if (page) return page;
  if (
    path.startsWith("/@") ||
    path.startsWith("/src/") ||
    path.startsWith("/node_modules/") ||
    path.startsWith("/assets/") ||
    path.startsWith("/images/") ||
    path.includes(".")
  ) {
    return "asset";
  }
  return "not-found";
}
