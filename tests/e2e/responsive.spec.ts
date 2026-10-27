import { expect, test } from '@playwright/test';

const NARROWEST_SUPPORTED_WIDTH = 320;
// Spanish copy is the longest, so both languages are checked.
const ROUTES = ['', '/learn', '/orbits', '/orbits/butterfly-i'];
const LOCALES = ['en', 'es'];

test('no page scrolls horizontally at the narrowest supported width', async ({ page }) => {
  await page.setViewportSize({ width: NARROWEST_SUPPORTED_WIDTH, height: 800 });
  for (const route of LOCALES.flatMap((locale) => ROUTES.map((path) => `/${locale}${path}`))) {
    await page.goto(route);
    await page.locator('main h1').waitFor();
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth, route).toBeLessThanOrEqual(clientWidth);
  }
});
