import { expect, test } from '@playwright/test';

test('home explains the three-body problem and leads to each section', async ({ page }) => {
  await page.goto('/en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('The three-body problem');
  await expect(
    page.getByRole('heading', { level: 2, name: 'What is the three-body problem?' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Two bodies: solved' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await page.getByRole('link', { name: 'Start with gravity' }).click();
  await expect(page).toHaveURL(/\/en\/learn$/);
  await page.goBack();
  await page.getByRole('link', { name: 'Go to Orbits' }).click();
  await expect(page).toHaveURL(/\/en\/orbits$/);
});
