import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('home, learning, gallery and orbit pages have no detected serious accessibility violations in either theme', async ({
  page,
}) => {
  for (const route of [
    '/en',
    '/en/learn',
    '/en/orbits',
    '/en/orbits?family=I.B&compare=goggles,moth-i',
    '/en/orbits/figure-eight',
  ]) {
    await page.goto(route);
    for (const theme of ['light', 'dark']) {
      await page.getByLabel('Theme', { exact: true }).selectOption(theme);
      if (route.includes('figure-eight'))
        await page.getByRole('button', { name: 'Play', exact: true }).waitFor();
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(
        results.violations.map(({ id, nodes }) => ({
          id,
          elements: nodes.map((node) => node.target),
        })),
      ).toEqual([]);
    }
  }
});
