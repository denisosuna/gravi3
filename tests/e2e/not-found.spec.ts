import { expect, test } from '@playwright/test';

test('unknown orbits and paths answer 404 with a translated way back', async ({ page }) => {
  const orbit = await page.goto('/en/orbits/not-an-orbit');
  expect(orbit?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This page does not exist');
  await page.getByRole('link', { name: 'See the six orbits' }).click();
  await expect(page).toHaveURL(/\/en\/orbits$/);

  const path = await page.goto('/es/no-existe');
  expect(path?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Esta página no existe');
  await expect(page.getByRole('link', { name: 'Empezar por la gravedad' })).toBeVisible();
});
