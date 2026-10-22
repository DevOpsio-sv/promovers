import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import react from "@vitejs/plugin-react";
import { build, loadEnv } from "vite";
import { applyTemplate, pageHead } from "./html-template.ts";

const env = loadEnv("production", process.cwd(), "VITE_");
const configuredSite = fs.readFileSync("wrangler.jsonc", "utf8").match(/"SITE_URL"\s*:\s*"([^"]+)"/)?.[1];
const siteUrl = (env.VITE_SITE_URL || configuredSite || "https://promovers.vasileva-silvena.workers.dev").replace(
  /\/$/,
  "",
);
const indexing = env.VITE_INDEXING_ENABLED === "true";

await build({
  configFile: false,
  plugins: [react()],
  build: {
    ssr: "src/entry-server.tsx",
    outDir: "dist/server",
    emptyOutDir: true,
  },
});

const serverModule = await import(pathToFileURL(path.resolve("dist/server/entry-server.js")).href);
const render = serverModule.render as (url: string) => string;
const templatePath = fs.existsSync("dist/client/index.html")
  ? path.resolve("dist/client/index.html")
  : path.resolve("dist/index.html");
const template = fs.readFileSync(templatePath, "utf8");
const clientDir = path.dirname(templatePath);

function write(pagePath: "/" | "/privacy" | "/cookies" | "/404", filePath: string) {
  const html = applyTemplate(template, siteUrl, pageHead(siteUrl, pagePath, indexing)).replace(
    "<!--app-html-->",
    render(pagePath),
  );
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, html);
}

write("/", templatePath);
write("/privacy", path.join(clientDir, "privacy", "index.html"));
write("/cookies", path.join(clientDir, "cookies", "index.html"));
write("/404", path.join(clientDir, "404.html"));
console.log(`Prerendered ${siteUrl} (indexing: ${indexing ? "on" : "off"})`);
