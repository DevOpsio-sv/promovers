export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  ENVIRONMENT: string;
  SITE_URL: string;
  INDEXING_ENABLED?: string;
  REDIRECT_TO_PRIMARY?: string;
  PRIMARY_ORIGIN?: string;
  TURNSTILE_SECRET_KEY?: string;
  IP_HASH_SALT?: string;
  EMAIL_API_URL?: string;
  EMAIL_API_KEY?: string;
  EMAIL_FROM?: string;
  EMAIL_TO?: string;
  RATE_LIMIT_PER_HOUR?: string;
  TEST_ACCESS_KEY?: string;
  TEST_MIGRATIONS?: { name: string; queries: string[] }[];
}
