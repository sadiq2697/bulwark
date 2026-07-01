import { test, expect, chromium } from "@playwright/test";
import path from "node:path";

const EXT = path.resolve(".");

test("extension loads and popup shows toggle", async () => {
  const ctx = await chromium.launchPersistentContext("", {
    headless: false,
    args: [`--headless=new`, `--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`],
  });
  let [sw] = ctx.serviceWorkers();
  if (!sw) sw = await ctx.waitForEvent("serviceworker");
  const extId = sw.url().split("/")[2];
  const page = await ctx.newPage();
  await page.goto(`chrome-extension://${extId}/src/popup/popup.html`);
  await expect(page.locator("header .brand")).toContainText("Bulwark");
  await expect(page.locator("#siteToggle")).toBeAttached();
  await ctx.close();
});
