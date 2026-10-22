import { useState } from "react";
import { HomePage } from "./pages/HomePage.tsx";
import { PrivacyPage } from "./pages/PrivacyPage.tsx";

export function App({ initialPath }: { initialPath: string }) {
  const [path] = useState(initialPath);
  if (path === "/privacy") return <PrivacyPage />;
  return <HomePage />;
}
