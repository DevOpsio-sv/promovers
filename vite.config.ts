import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";
import { applyTemplate, pageHead } from "./scripts/html-template.ts";

function devMeta(): Plugin {
  return {
    name: "promovers-dev-meta",
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        if (!ctx.server) return html;
        const siteUrl = (process.env.VITE_SITE_URL || "http://127.0.0.1:5173").replace(/\/$/, "");
        return applyTemplate(html, siteUrl, pageHead(siteUrl, "/", false));
      },
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    devMeta(),
    cloudflare({ viteEnvironment: { name: "worker" } }),
  ],
  environments: {
    worker: { build: { sourcemap: true } },
  },
});
