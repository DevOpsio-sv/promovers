import { mkdir } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";

const desktop = [
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1280, height: 800 },
  { width: 1920, height: 1080 },
  { width: 1024, height: 768 },
] as const;

const compact = [
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 375, height: 812 },
  { width: 320, height: 640 },
] as const;

type Box = { top: number; right: number; bottom: number; left: number; width: number; height: number };

async function measure(page: Page) {
  return page.evaluate(() => {
    const read = (selector: string) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      };
    };
    const title = document.getElementById("page-title");
    const lines = title
      ? [...title.querySelectorAll(".hero-line")].map((line) => line.getClientRects().length)
      : [];
    return {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      clientWidth: document.documentElement.clientWidth,
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      hero: read(".hero"),
      header: read(".site-header"),
      title: read("#page-title"),
      lead: read(".hero-lead"),
      actions: read(".hero-actions"),
      trust: read(".hero-trust"),
      calc: read("#calculator"),
      photo: read(".hero-media"),
      copy: read(".hero-copy"),
      titleOverflow: title ? title.scrollWidth - title.clientWidth : 99,
      lines,
      fontSize: title ? Number.parseFloat(getComputedStyle(title).fontSize) : 0,
      manrope: document.fonts.check("700 32px Manrope"),
      cls: (window as Window & { __cls?: number }).__cls ?? 0,
    };
  });
}

async function openAt(page: Page, viewport: { width: number; height: number }) {
  await page.addInitScript(() => {
    const target = window as Window & { __cls?: number };
    target.__cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
        if (!shift.hadRecentInput && typeof shift.value === "number") {
          target.__cls = (target.__cls ?? 0) + shift.value;
        }
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.setViewportSize(viewport);
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
}

function inside(box: Box | null, width: number, height: number, label: string) {
  expect(box, label).not.toBeNull();
  const item = box as Box;
  expect(item.top, `${label} top`).toBeGreaterThanOrEqual(-1);
  expect(item.left, `${label} left`).toBeGreaterThanOrEqual(-1);
  expect(item.bottom, `${label} bottom`).toBeLessThanOrEqual(height + 1);
  expect(item.right, `${label} right`).toBeLessThanOrEqual(width + 1);
  expect(item.width, `${label} width`).toBeGreaterThan(0);
  expect(item.height, `${label} height`).toBeGreaterThan(0);
}

test.describe("first screen", () => {
  test.beforeAll(async () => {
    await mkdir("test-results/hero-ui", { recursive: true });
  });

  test.beforeEach(({ page }, testInfo) => {
    void page;
    test.skip(testInfo.project.name !== "desktop", "viewport matrix runs once");
  });

  for (const viewport of desktop) {
    test(`fits the initial hero at ${viewport.width}×${viewport.height}`, async ({ page }) => {
      await openAt(page, viewport);
      await expect(page.getByRole("heading", { level: 1, name: "Хамалски и транспортни услуги в София" })).toBeVisible();
      await page.screenshot({
        path: `test-results/hero-ui/desktop-${viewport.width}x${viewport.height}.png`,
        fullPage: false,
      });

      const metrics = await measure(page);
      expect(metrics.overflowX).toBeLessThanOrEqual(1);
      expect(metrics.manrope).toBe(true);
      expect(metrics.titleOverflow).toBeLessThanOrEqual(1);
      inside(metrics.header, metrics.innerWidth, metrics.innerHeight, "header");
      inside(metrics.title, metrics.innerWidth, metrics.innerHeight, "title");
      inside(metrics.lead, metrics.innerWidth, metrics.innerHeight, "lead");
      inside(metrics.actions, metrics.innerWidth, metrics.innerHeight, "actions");
      inside(metrics.trust, metrics.innerWidth, metrics.innerHeight, "trust");
      inside(metrics.calc, metrics.innerWidth, metrics.innerHeight, "calculator");
      inside(metrics.photo, metrics.innerWidth, metrics.innerHeight, "photo");
      expect(metrics.hero?.bottom ?? 9999).toBeLessThanOrEqual(metrics.innerHeight + 2);
      expect(metrics.copy && metrics.calc ? metrics.copy.right : 0).toBeLessThanOrEqual((metrics.calc?.left ?? 0) + 1);
      expect(metrics.photo?.left ?? 99).toBeLessThanOrEqual(1);
      expect(metrics.photo?.right ?? 0).toBeGreaterThanOrEqual(metrics.clientWidth - 1);
      expect(metrics.photo?.top ?? 99).toBeLessThanOrEqual((metrics.header?.bottom ?? 0) + 2);
      if (viewport.width >= 1200) expect(metrics.lines).toEqual([1, 1, 1]);
      expect(metrics.fontSize).toBeGreaterThanOrEqual(32);
      expect(metrics.cls).toBeLessThanOrEqual(0.1);
    });
  }

  for (const viewport of compact) {
    test(`stays usable at ${viewport.width}×${viewport.height}`, async ({ page }) => {
      await openAt(page, viewport);
      await page.screenshot({
        path: `test-results/hero-ui/compact-${viewport.width}x${viewport.height}.png`,
        fullPage: false,
      });
      const metrics = await measure(page);
      expect(metrics.overflowX).toBeLessThanOrEqual(1);
      expect(metrics.titleOverflow).toBeLessThanOrEqual(1);
      expect(metrics.fontSize).toBeGreaterThanOrEqual(28);
      expect(metrics.manrope).toBe(true);
      expect(metrics.photo && metrics.calc ? metrics.photo.top : 0).toBeGreaterThanOrEqual((metrics.calc?.bottom ?? 9999) - 1);

      const targets = await page.evaluate(() => {
        const nodes = [
          ...document.querySelectorAll(".hero-btn, .menu-button, .calc-option"),
        ] as HTMLElement[];
        return nodes.map((node) => {
          const rect = node.getBoundingClientRect();
          return { height: rect.height, width: rect.width };
        });
      });
      expect(targets.length).toBeGreaterThan(0);
      for (const target of targets) {
        expect(target.height).toBeGreaterThanOrEqual(44);
        expect(target.width).toBeGreaterThanOrEqual(44);
      }
    });
  }

  test("calculator, request form and lower sections keep working", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const calculator = page.getByRole("region", { name: "Калкулатор" });
    await expect(calculator.getByRole("heading", { name: "Изчислете ориентировъчна цена" })).toBeVisible();
    await expect(calculator.getByTestId("estimate-amount")).toHaveText("Изберете услуга");

    const services = ["Хамали", "Бус", "Преместване", "Мебели", "Отпадъци", "Разчистване"];
    for (const name of services) {
      const radio = calculator.getByRole("radio", { name, exact: true });
      await radio.evaluate((element) => element.scrollIntoView({ block: "center" }));
      await radio.locator("xpath=..").click();
      await expect(radio).toBeChecked();
      await expect(calculator.getByTestId("estimate-amount")).not.toHaveText("Изберете услуга");
    }

    await calculator.getByRole("radio", { name: "Хамали" }).focus();
    await page.keyboard.press("ArrowDown");
    await expect(calculator.getByRole("radio", { name: "Бус" })).toBeChecked();

    await calculator.getByRole("radio", { name: "Преместване" }).check();
    await expect(calculator.getByRole("button", { name: "Двустаен" })).toBeVisible();
    const calcBox = await calculator.boundingBox();
    const servicesBox = await page.locator("#services").boundingBox();
    expect(servicesBox && calcBox ? servicesBox.y : 0).toBeGreaterThanOrEqual(
      (calcBox?.y ?? 0) + (calcBox?.height ?? 0) - 1,
    );

    await page.getByRole("link", { name: "Заяви услуга" }).click();
    await expect(page.locator("#request")).toBeInViewport();
    await expect(page.getByRole("heading", { name: "Услуги в София", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Как се заявява" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Въпроси преди заявка" })).toBeVisible();
  });

  test("mobile menu opens and closes from the keyboard", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const opener = page.getByRole("button", { name: "Отвори менюто" });
    await opener.click();
    const menu = page.getByRole("navigation", { name: "Меню" });
    await expect(menu.getByRole("link", { name: "Услуги" })).toBeVisible();
    await expect(menu.getByRole("link", { name: "Как работи" })).toBeVisible();
    await expect(menu.getByRole("link", { name: "Въпроси" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    await expect(opener).toBeFocused();
  });
});
