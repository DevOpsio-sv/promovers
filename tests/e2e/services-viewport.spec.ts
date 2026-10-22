import { expect, test, type Page } from "@playwright/test";

const desktop = [
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1024, height: 768 },
] as const;

const compact = [
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 375, height: 812 },
] as const;

const services = [
  ["Хамалски услуги", "Хамали", "Помощ при пренасяне, товарене и разтоварване на мебели, техника и тежки предмети."],
  ["Транспорт с бус", "Бус", "Удобен транспорт на мебели, уреди и лични вещи в София."],
  ["Преместване на жилища и офиси", "Преместване", "Организирано преместване на дома или офиса с грижа към вещите ви."],
  ["Извозване на стари мебели", "Мебели", "Освободете пространство без излишни усилия."],
  ["Извозване на строителни отпадъци", "Отпадъци", "Помощ при изнасяне и транспорт на опаковани отпадъци след ремонт."],
  ["Разчистване на мазета, тавани и гаражи", "Разчистване", "Практична помощ при освобождаване и разчистване на помещения."],
] as const;

async function openHome(page: Page, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
}

test.describe("services viewport", () => {
  test.beforeEach(({ page }, testInfo) => {
    void page;
    test.skip(testInfo.project.name !== "desktop", "viewport matrix runs once");
  });

  for (const viewport of desktop) {
    test(`fits one desktop viewport at ${viewport.width}×${viewport.height}`, async ({ page }) => {
      await openHome(page, viewport);
      await page.evaluate(() => {
        const root = document.documentElement;
        const previous = root.style.scrollBehavior;
        root.style.scrollBehavior = "auto";
        document.querySelector("#services")?.scrollIntoView({ block: "start", behavior: "instant" });
        root.style.scrollBehavior = previous;
      });

      const metrics = await page.evaluate(() => {
        const section = document.querySelector<HTMLElement>(".services-screen");
        const header = document.querySelector<HTMLElement>(".site-header");
        const title = document.getElementById("services-title");
        const how = document.getElementById("how");
        const summary = document.querySelector<HTMLElement>(".service-card-summary");
        const cards = [...document.querySelectorAll<HTMLElement>(".service-card")];
        if (!section || !header || !title || !how || !summary) return null;
        const sectionRect = section.getBoundingClientRect();
        const headerRect = header.getBoundingClientRect();
        const titleRect = title.getBoundingClientRect();
        const howRect = how.getBoundingClientRect();
        return {
          innerHeight: window.innerHeight,
          overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          sectionTop: sectionRect.top,
          sectionBottom: sectionRect.bottom,
          titleTop: titleRect.top,
          headerBottom: headerRect.bottom,
          howBottom: howRect.bottom,
          cards: cards.length,
          cardOverflow: cards.some((card) => card.scrollWidth - card.clientWidth > 1),
          cardFont: Number.parseFloat(getComputedStyle(summary).fontSize),
          titleFont: Number.parseFloat(getComputedStyle(title).fontSize),
          columns: getComputedStyle(document.querySelector(".service-grid") as Element).gridTemplateColumns,
        };
      });

      expect(metrics).not.toBeNull();
      const box = metrics as NonNullable<typeof metrics>;
      expect(box.overflowX).toBeLessThanOrEqual(1);
      expect(box.sectionTop).toBeGreaterThanOrEqual(-1);
      expect(box.sectionTop).toBeLessThanOrEqual(1);
      expect(box.sectionBottom).toBeLessThanOrEqual(box.innerHeight + 1);
      expect(box.titleTop).toBeGreaterThanOrEqual(box.headerBottom - 1);
      expect(box.howBottom).toBeLessThanOrEqual(box.innerHeight + 1);
      expect(box.cards).toBe(6);
      expect(box.cardOverflow).toBe(false);
      expect(box.cardFont).toBeGreaterThanOrEqual(13.5);
      expect(box.titleFont).toBeGreaterThanOrEqual(26);
      expect(box.columns.split(" ").length).toBe(3);
    });
  }

  for (const viewport of compact) {
    test(`stays readable at ${viewport.width}×${viewport.height}`, async ({ page }) => {
      await openHome(page, viewport);
      const metrics = await page.evaluate(() => {
        const summary = document.querySelector<HTMLElement>(".service-card-summary");
        const cards = [...document.querySelectorAll<HTMLElement>(".service-card")];
        return {
          overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          cards: cards.length,
          cardOverflow: cards.some((card) => card.scrollWidth - card.clientWidth > 1),
          cardFont: summary ? Number.parseFloat(getComputedStyle(summary).fontSize) : 0,
          columns: getComputedStyle(document.querySelector(".service-grid") as Element).gridTemplateColumns,
        };
      });
      expect(metrics.overflowX).toBeLessThanOrEqual(1);
      expect(metrics.cards).toBe(6);
      expect(metrics.cardOverflow).toBe(false);
      expect(metrics.cardFont).toBeGreaterThanOrEqual(14);
      expect(metrics.columns.split(" ").length).toBe(viewport.width >= 720 ? 2 : 1);
    });
  }

  test("opens the matching service and sends it to the calculator", async ({ page }) => {
    await openHome(page, { width: 1440, height: 900 });
    await expect(page.getByText("Виж всички услуги")).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Виж всички услуги/i })).toHaveCount(0);

    for (const [title, menu, detail] of services) {
      const card = page.getByRole("button", { name: title, exact: true });
      await expect(card).toBeVisible();
      await expect(page.getByText(detail)).toHaveCount(0);
      await card.click();
      const dialog = page.getByRole("dialog", { name: title });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText(detail)).toBeVisible();
      await expect(page).toHaveURL(/\/$/);
      await dialog.getByRole("button", { name: "Изчисли цена" }).click();
      await expect(dialog).toBeHidden();
      const radio = page.getByRole("radio", { name: menu, exact: true });
      await expect(radio).toBeChecked();
      await expect(page.locator("#calculator")).toBeInViewport();
      await expect(page).toHaveURL(/\/$/);
    }

    await page.getByRole("button", { name: "Хамалски услуги", exact: true }).click();
    const movers = page.getByRole("dialog", { name: "Хамалски услуги" });
    await movers.getByRole("button", { name: "Изчисли цена" }).click();
    await expect(movers).toBeHidden();
    const oneMover = page.getByRole("button", { name: "Един хамалин" });
    await oneMover.click();
    await expect(oneMover).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("button", { name: "Хамалски услуги", exact: true }).click();
    await page.getByRole("dialog", { name: "Хамалски услуги" }).getByRole("button", { name: "Изчисли цена" }).click();
    await expect(oneMover).toHaveAttribute("aria-pressed", "true");
  });

  test("closes from escape, backdrop and the close controls, then restores focus", async ({ page }) => {
    await openHome(page, { width: 1440, height: 900 });
    const card = page.getByRole("button", { name: "Транспорт с бус", exact: true });
    await card.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Транспорт с бус" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(card).toBeFocused();

    await card.click();
    await dialog.getByRole("button", { name: "Затвори прозореца" }).click();
    await expect(dialog).toBeHidden();
    await expect(card).toBeFocused();

    await card.click();
    await dialog.getByRole("button", { name: "Затвори", exact: true }).click();
    await expect(dialog).toBeHidden();

    await card.click();
    await dialog.click({ position: { x: 8, y: 8 } });
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("radio", { name: "Бус", exact: true })).not.toBeChecked();
  });

  test("uses a bottom sheet and keeps the price action reachable on a phone", async ({ page }) => {
    await openHome(page, { width: 390, height: 844 });
    await page.getByRole("button", { name: "Извозване на строителни отпадъци", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Извозване на строителни отпадъци" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Не приемаме опасни, забранени или специално регулирани отпадъци.")).toBeVisible();
    const action = dialog.getByRole("button", { name: "Изчисли цена" });
    await expect(action).toBeInViewport();
    const box = await dialog.locator(".service-dialog-sheet").boundingBox();
    expect(box?.y ?? 0).toBeGreaterThan(80);
    await action.click();
    await expect(page.getByRole("radio", { name: "Отпадъци", exact: true })).toBeChecked();
  });
});
