import path from "node:path";
import { fileURLToPath } from "node:url";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    cloudflareTest(async () => ({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: {
        bindings: {
          TEST_MIGRATIONS: await readD1Migrations(path.join(root, "migrations")),
          ENVIRONMENT: "test",
          SITE_URL: "http://127.0.0.1:8787",
          INDEXING_ENABLED: "false",
          REDIRECT_TO_PRIMARY: "false",
          PRIMARY_ORIGIN: "https://promovers.bg",
          TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
          IP_HASH_SALT: "test-salt",
          RATE_LIMIT_PER_HOUR: "5",
          TEST_ACCESS_KEY: "test-access",
        },
      },
    })),
  ],
  test: {
    name: "api",
    include: ["tests/api/**/*.test.ts"],
    setupFiles: ["./tests/api/apply-migrations.ts"],
  },
});
