import { expect, test } from '@playwright/test';

const NARROWEST_SUPPORTED_WIDTH = 320;

test('no page scrolls horizontally at the narrowest supported width', async ({ page }) => {
  await page.setViewportSize({ width: NARROWEST_SUPPORTED_WIDTH, height: 800 });
  for (const route of ['/en', '/en/learn', '/en/orbits', '/en/orbits/butterfly-i']) {
    await page.goto(route);
    await page.locator('canvas, .gallery-grid, .home-hero').first().waitFor();
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth, route).toBeLessThanOrEqual(clientWidth);
  }
});
