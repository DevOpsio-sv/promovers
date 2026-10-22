import { expect, test } from "@playwright/test";

function futureDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Sofia",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000));
}

test("visitor calculates a price and stores a request", async ({ page, request }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Хамалски и транспортни услуги в София" }),
  ).toBeVisible();

  const calculator = page.getByRole("region", { name: "Калкулатор" });
  const box = await calculator.boundingBox();
  const width = page.viewportSize()?.width ?? 1440;
  if (width < 800) expect(box?.y ?? 9999).toBeLessThan(780);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);

  await calculator.getByRole("radio", { name: "Хамали" }).check();
  await expect(calculator.getByTestId("estimate-amount")).toContainText("70");
  await calculator.getByRole("button", { name: "Един хамалин" }).click();
  await expect(calculator.getByTestId("estimate-amount")).toContainText("36");
  await calculator.getByRole("link", { name: "Изпрати заявка" }).click();

  const form = page.locator("#request");
  await expect(form.locator("select").first()).toHaveValue("movers");
  await form.getByLabel("Име", { exact: true }).fill("Мария Георгиева");
  await form.getByLabel("Телефон").fill("0888 123 456");
  await form.getByLabel("Адрес / район в София").fill("Младост 1");
  await form.getByLabel("Предпочитана дата").fill(futureDate());
  await form.getByRole("checkbox").check();
  await expect(page.getByTestId("turnstile-status")).toHaveText("ready");
  await form.getByRole("button", { name: "Изпрати заявка" }).click();

  const reference = (await page.getByTestId("reference-number").textContent())?.trim() ?? "";
  expect(reference).toMatch(/^PM-\d{6}-/);
  await expect(page.getByRole("heading", { name: "Получихме заявката ви!" })).toBeVisible();

  const stored = await request.get(`/api/test/requests/${reference}`, {
    headers: { "x-test-access": "local-test-access" },
  });
  expect(stored.ok()).toBeTruthy();
  const body = (await stored.json()) as { status: string; minEur: number; service: string };
  expect(body.status).toBe("NEW");
  expect(body.service).toBe("movers");
  expect(body.minEur).toBe(36);
});
