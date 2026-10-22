import { useState } from "react";
import { CookiesPage } from "./pages/CookiesPage.tsx";
import { HomePage } from "./pages/HomePage.tsx";
import { NotFoundPage } from "./pages/NotFoundPage.tsx";
import { PrivacyPage } from "./pages/PrivacyPage.tsx";

export function App({ initialPath }: { initialPath: string | null }) {
  const [path] = useState(initialPath);
  if (path === "/privacy") return <PrivacyPage />;
  if (path === "/cookies") return <CookiesPage />;
  if (path === "/") return <HomePage />;
  return <NotFoundPage />;
}
