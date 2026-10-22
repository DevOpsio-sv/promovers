import { expect, test, type Page } from "@playwright/test";

const desktop = [
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
] as const;

const widths = [1440, 1366, 1024, 768, 390, 375] as const;

async function openHome(page: Page, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
}

async function alignClosing(page: Page) {
  await page.evaluate(() => {
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    document.querySelector(".closing-viewport")?.scrollIntoView({ block: "start", behavior: "instant" });
    root.style.scrollBehavior = previous;
  });
}

test.describe("closing viewport", () => {
  test.beforeEach(({ page }, testInfo) => {
    void page;
    test.skip(testInfo.project.name !== "desktop", "viewport matrix runs once");
  });

  for (const viewport of desktop) {
    test(`fits the trust, booking and footer at ${viewport.width}×${viewport.height}`, async ({ page }) => {
      await openHome(page, viewport);
      await expect(page.getByTestId("turnstile-status")).toHaveText("ready", { timeout: 20_000 });
      await alignClosing(page);

      const metrics = await page.evaluate(() => {
        const section = document.querySelector<HTMLElement>(".closing-viewport");
        const footer = document.querySelector<HTMLElement>(".site-footer");
        const title = document.getElementById("why-title");
        const input = document.querySelector<HTMLElement>(".book-input");
        const trust = document.querySelector<HTMLElement>(".trust-copy p");
        const card = document.querySelector<HTMLElement>(".book-card");
        if (!section || !footer || !title || !input || !trust || !card) return null;
        const sectionRect = section.getBoundingClientRect();
        const footerRect = footer.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        return {
          innerHeight: window.innerHeight,
          overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          sectionTop: sectionRect.top,
          footerBottom: footerRect.bottom,
          cardRight: cardRect.right,
          sectionRight: sectionRect.right,
          titleFont: Number.parseFloat(getComputedStyle(title).fontSize),
          inputFont: Number.parseFloat(getComputedStyle(input).fontSize),
          trustFont: Number.parseFloat(getComputedStyle(trust).fontSize),
          columns: getComputedStyle(document.querySelector(".closing-layout") as Element).gridTemplateColumns,
        };
      });

      expect(metrics).not.toBeNull();
      const box = metrics as NonNullable<typeof metrics>;
      expect(box.overflowX).toBeLessThanOrEqual(1);
      expect(box.sectionTop).toBeGreaterThanOrEqual(-1);
      expect(box.sectionTop).toBeLessThanOrEqual(1);
      expect(box.footerBottom).toBeLessThanOrEqual(box.innerHeight + 1);
      expect(box.cardRight).toBeLessThanOrEqual(box.sectionRight + 1);
      expect(box.titleFont).toBeGreaterThanOrEqual(22);
      expect(box.inputFont).toBeGreaterThanOrEqual(16);
      expect(box.trustFont).toBeGreaterThanOrEqual(13.5);
      expect(box.columns.split(" ").length).toBe(2);
    });
  }

  for (const width of widths) {
    test(`does not scroll sideways at ${width}px`, async ({ page }) => {
      await openHome(page, { width, height: width >= 1024 ? 768 : 844 });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
      const input = page.locator(".book-input").first();
      await input.scrollIntoViewIfNeeded();
      const fontSize = await input.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
      expect(fontSize).toBeGreaterThanOrEqual(16);
    });
  }

  test("places booking before the questions on a phone", async ({ page }) => {
    await openHome(page, { width: 390, height: 844 });
    const order = await page.evaluate(() => {
      const top = (selector: string) => document.querySelector(selector)?.getBoundingClientRect().top ?? 0;
      return { trust: top(".closing-trust"), book: top(".book-card"), faq: top(".closing-faq") };
    });
    expect(order.trust).toBeLessThan(order.book);
    expect(order.book).toBeLessThan(order.faq);
  });

  test("keeps one accordion answer open and usable from the keyboard", async ({ page }) => {
    await openHome(page, { width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const first = page.getByRole("button", { name: "Окончателна ли е изчислената цена?" });
    const second = page.getByRole("button", { name: "Извършвате ли спешни премествания?" });
    await first.focus();
    await page.keyboard.press("Enter");
    await expect(first).toHaveAttribute("aria-expanded", "true");
    const answer = page.getByText("Калкулаторът показва ориентировъчна цена според избраните услуги");
    await expect(answer).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await expect(second).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(first).toHaveAttribute("aria-expanded", "false");
    await expect(second).toHaveAttribute("aria-expanded", "true");
    const openAnswer = page.getByText("Можете да изпратите заявка с желаната дата.");
    await expect(openAnswer).toBeVisible();
    const clipped = await openAnswer.evaluate((element) => {
      let node = element.parentElement;
      while (node && node !== document.body) {
        const style = getComputedStyle(node);
        const locks = style.overflowY === "hidden" || style.overflowY === "auto" || style.overflowY === "scroll";
        if (locks && node.scrollHeight > node.clientHeight + 2) return true;
        node = node.parentElement;
      }
      return false;
    });
    expect(clipped).toBe(false);
  });

  test("carries the calculator service into the request and back again", async ({ page }) => {
    await openHome(page, { width: 1440, height: 900 });
    const calculator = page.getByRole("region", { name: "Калкулатор" });
    await calculator.getByRole("radio", { name: "Хамали" }).check();
    await calculator.getByRole("button", { name: "Един хамалин" }).click();
    await calculator.getByRole("link", { name: "Изпрати заявка" }).click();

    const form = page.locator("#request");
    await expect(form.locator("select")).toHaveValue("movers");
    await expect(page.getByTestId("booking-estimate")).toContainText("36");
    await form.getByLabel("Име", { exact: true }).fill("Иван Петров");
    await form.locator("select").selectOption("van");
    await expect(form.getByLabel("Име", { exact: true })).toHaveValue("Иван Петров");
    await expect(calculator.getByRole("radio", { name: "Бус", exact: true })).toBeChecked();
    await expect(calculator.getByRole("button", { name: "Само бус и шофьор" })).toBeVisible();
  });

  test("shows field errors only after an attempt and keeps the values", async ({ page }) => {
    await openHome(page, { width: 390, height: 844 });
    const form = page.locator("#request");
    await form.scrollIntoViewIfNeeded();
    await expect(form.locator(".book-error")).toHaveCount(0);
    await form.getByRole("button", { name: "Изпрати заявка" }).click();
    await expect(form.getByLabel("Име", { exact: true })).toBeFocused();
    await expect(page.locator("#request-name-error")).toContainText("Въведете име.");
    await form.getByLabel("Име", { exact: true }).fill("Мария Георгиева");
    await form.getByLabel("Телефон", { exact: true }).fill("12345");
    await form.getByRole("button", { name: "Изпрати заявка" }).click();
    await expect(page.locator("#request-phone-error")).toContainText("български телефон");
    await expect(form.getByLabel("Име", { exact: true })).toHaveValue("Мария Георгиева");
    await expect(form.getByLabel("Телефон", { exact: true })).toHaveValue("12345");
  });

  test("opens a service, prices it, and finds that service in the request", async ({ page }) => {
    await openHome(page, { width: 1440, height: 900 });
    await page.getByRole("button", { name: "Транспорт с бус", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Транспорт с бус" });
    await dialog.getByRole("button", { name: "Изчисли цена" }).click();
    await expect(dialog).toBeHidden();
    await page.getByRole("region", { name: "Калкулатор" }).getByRole("link", { name: "Изпрати заявка" }).click();
    await expect(page.locator("#request select")).toHaveValue("van");
    await expect(page.getByTestId("booking-estimate")).toBeVisible();
  });
});
