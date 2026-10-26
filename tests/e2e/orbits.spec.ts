import { expect, test } from '@playwright/test';

test('all six shared URLs open directly with validated data and playback controls', async ({
  page,
}) => {
  for (const slug of [
    'lagrange',
    'figure-eight',
    'butterfly-i',
    'goggles',
    'moth-i',
    'yin-yang-i',
  ]) {
    const response = await page.goto(`/en/orbits/${slug}`);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
    await expect(page.getByRole('slider', { name: 'Orbit timeline' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});

test('play, pause, seek, locale and theme preserve playback context', async ({ page }) => {
  await page.goto('/es/orbits/figure-eight');
  await page.locator('canvas').waitFor();
  await page.getByRole('button', { name: 'Reproducir', exact: true }).click();
  const slider = page.getByRole('slider', { name: 'Tiempo en la órbita' });
  await expect.poll(async () => Number(await slider.inputValue())).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  await slider.focus();
  await slider.press('End');
  await slider.press('ArrowLeft');
  const time = await slider.inputValue();
  await page.getByRole('button', { name: '3D', exact: true }).click();
  await page.getByLabel('Tema', { exact: true }).selectOption('light');
  expect(await slider.inputValue()).toBe(time);
  await page.getByLabel('Idioma', { exact: true }).selectOption('en');
  await expect(page.getByRole('slider', { name: 'Orbit timeline' })).toHaveValue(time);
  await expect(page.getByRole('button', { name: '3D', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Restart', exact: true }).click();
  await expect(page.getByRole('slider', { name: 'Orbit timeline' })).toHaveValue('0');
});

test('returning to the gallery restores the originating card and keyboard focus', async ({
  page,
}) => {
  await page.goto('/en/orbits');
  const card = page.locator('#orbit-yin-yang-i');
  await card.scrollIntoViewIfNeeded();
  await card.click();
  await page.getByRole('link', { name: 'Back to gallery' }).click();
  await expect(card).toBeFocused();
  await card.click();
  await page.goBack();
  await expect(card).toBeFocused();
});

test('WebGL loss offers the scientific preview and a retry', async ({ page }) => {
  await page.goto('/en/orbits/figure-eight');
  const canvas = page.locator('canvas');
  await canvas.waitFor();
  await canvas.evaluate((element) =>
    element.dispatchEvent(new Event('webglcontextlost', { cancelable: true })),
  );
  await expect(page.getByText('The 3D scene is unavailable.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.locator('canvas')).toBeVisible();
});
