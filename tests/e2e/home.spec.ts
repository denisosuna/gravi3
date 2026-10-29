import { expect, test } from '@playwright/test';

test('home introduces the problem in three capsules and leads to each section', async ({
  page,
}) => {
  await page.goto('/en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('The three-body problem');
  await expect(
    page.getByRole('heading', { level: 2, name: 'Can you predict how three bodies move?' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Why it matters' })).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Why it matters' })).toBeFocused();
  await expect(page.getByRole('heading', { level: 3, name: 'Two bodies: solved' })).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('heading', { name: 'How you will learn' })).toBeFocused();
  await page.getByRole('link', { name: 'Start with the calibration' }).click();
  await expect(page).toHaveURL(/\/en\/learn\/calibration$/);
  await page.goBack();
  await page.getByRole('button', { name: /^Go to capsule 1/ }).click();
  await page.getByRole('link', { name: 'Start with gravity' }).click();
  await expect(page).toHaveURL(/\/en\/learn$/);
});
