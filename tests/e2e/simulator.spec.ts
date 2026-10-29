import { expect, test } from '@playwright/test';

test('the free laboratory runs presets, reports diagnostics and accepts edits', async ({
  page,
}) => {
  await page.goto('/en/learn#lab');
  const simulator = page.getByRole('region', { name: 'Free laboratory' });
  await expect(simulator.getByTestId('simulator-scene').locator('canvas')).toBeVisible();

  await simulator.getByRole('button', { name: /Pythagorean/ }).click();
  await expect(simulator.getByRole('button', { name: /Pythagorean/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const time = simulator.locator('dt', { hasText: 'Time' }).locator('+ dd');
  await expect(time).toHaveText('0');
  await simulator.getByRole('button', { name: 'Play' }).click();
  await expect.poll(async () => Number(await time.textContent())).toBeGreaterThan(0.5);
  await simulator.getByRole('button', { name: 'Pause' }).click();
  const drift = await simulator
    .locator('dt', { hasText: 'Energy change' })
    .locator('+ dd')
    .textContent();
  expect(Math.abs(Number(drift?.replace('%', '')))).toBeLessThan(0.001);

  await simulator.getByRole('button', { name: 'Perturb 1%' }).click();
  await expect(simulator.getByRole('button', { name: /Custom|Pythagorean/ }).first()).toBeVisible();
  await expect(time).toHaveText('0');
  await simulator.getByText('Edit bodies').click();
  await expect(simulator.getByRole('group', { name: 'Body 1' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('guided capsules start from the system they talk about', async ({ page }) => {
  await page.goto('/en/learn#chaos');
  const capsule = page.getByRole('region', { name: 'A 1% change changes everything' });
  await expect(capsule.getByTestId('simulator-scene').locator('canvas')).toBeVisible();
  await expect(capsule.locator('dt', { hasText: 'Time' })).toBeVisible();
  await expect(capsule.locator('dt', { hasText: 'Total energy' })).toHaveCount(0);
  await capsule.getByRole('button', { name: 'Play' }).click();
  await capsule.getByRole('button', { name: 'Perturb 1%' }).click();
  await expect(capsule.getByRole('button', { name: 'Play' })).toBeVisible();
});
