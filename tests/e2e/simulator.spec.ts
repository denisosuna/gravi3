import { expect, test } from '@playwright/test';

test('the three-body simulator runs presets, reports diagnostics and accepts edits', async ({
  page,
}) => {
  await page.goto('/en/learn');
  const simulator = page.getByRole('region', { name: 'Add a third body' });
  await simulator.scrollIntoViewIfNeeded();
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
