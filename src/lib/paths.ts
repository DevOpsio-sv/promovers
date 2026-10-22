export function normalizePath(pathname: string): string {
  const path = pathname.replace(/\/+$/, "") || "/";
  return path === "/privacy" ? "/privacy" : "/";
}
