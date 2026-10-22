import { expect, test } from "@playwright/test";

test("search metadata, storage and unknown URLs stay within the public page", async ({ page, request }) => {
  const thirdParty: string[] = [];
  page.on("request", (item) => {
    const host = new URL(item.url()).host;
    if (
      host.includes("google-analytics") ||
      host.includes("googletagmanager") ||
      host.includes("facebook") ||
      host.includes("doubleclick") ||
      host.includes("hotjar")
    ) {
      thirdParty.push(item.url());
    }
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  expect(response?.headers()["x-robots-tag"]).toContain("noindex");
  await expect(page.locator("html")).toHaveAttribute("lang", "bg");
  await expect(page).toHaveTitle("Хамалски услуги София | Транспорт и извозване | ProMovers");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /Преместване на жилища и офиси/,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/$/);
  await expect(page.getByRole("region", { name: "Калкулатор" })).toBeVisible();
  await expect(page.getByText("Приемам всички")).toHaveCount(0);

  const storage = await page.evaluate(() => ({
    cookie: document.cookie,
    local: localStorage.length,
    session: sessionStorage.length,
  }));
  expect(storage.local).toBe(0);
  expect(storage.session).toBe(0);
  expect(storage.cookie).not.toMatch(/_ga|_gid|fbclid|fr=/);
  expect(thirdParty).toEqual([]);
  expect(errors.filter((error) => /hydrat/i.test(error))).toEqual([]);

  await page.goto("/cookies");
  await expect(page.getByRole("heading", { level: 1, name: "Политика за бисквитките" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Какво представляват бисквитките?" })).toBeVisible();

  const missing = await request.get("/this-page-is-not-a-service");
  expect(missing.status()).toBe(404);
  expect(missing.headers()["x-robots-tag"]).toContain("noindex");
  expect(await missing.text()).not.toContain("Хамалски и транспортни услуги в София");

  const favicon = await request.get("/favicon.svg");
  expect(favicon.ok()).toBeTruthy();
  const unknownApi = await request.get("/api/does-not-exist");
  expect(unknownApi.status()).toBe(404);
});
