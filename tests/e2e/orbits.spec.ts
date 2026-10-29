import { expect, test } from '@playwright/test';

test('all six shared URLs open directly with validated data and playback controls', async ({
  page,
}) => {
  const socialImage = await page.request.get('/opengraph-image');
  expect(socialImage.status()).toBe(200);
  expect(socialImage.headers()['content-type']).toContain('image/png');
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
  await expect(page).toHaveURL(/\/en\/orbits\/yin-yang-i$/);
  await expect(page.getByRole('link', { name: 'Back to gallery' })).toBeInViewport();
  await page.getByRole('link', { name: 'Back to gallery' }).click();
  await expect(card).toBeFocused();
  await card.click();
  await expect(page).toHaveURL(/\/en\/orbits\/yin-yang-i$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/en\/orbits$/);
  await expect(card).toBeFocused();
});

test('WebGL loss offers the scientific preview and a retry', async ({ page }) => {
  await page.goto('/en/orbits/figure-eight');
  const canvas = page.locator('canvas[data-ready="true"]');
  await canvas.waitFor();
  await canvas.evaluate((element) =>
    element.dispatchEvent(new Event('webglcontextlost', { cancelable: true })),
  );
  await expect(page.getByText('The 3D scene is unavailable.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.locator('canvas')).toBeVisible();
});

test('a rotated camera survives locale navigation without scene lifecycle errors', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/en/orbits/figure-eight');
  await page.addStyleTag({
    content: '.scene-container{height:400px!important;flex:none!important}',
  });
  await page.locator('canvas[data-ready="true"]').waitFor();
  const sceneWidth = await page
    .locator('.scene-container')
    .evaluate((element) => Math.floor(element.getBoundingClientRect().width) - 32);
  await page.addStyleTag({ content: `.scene-container{width:${sceneWidth}px!important}` });
  await page.getByRole('button', { name: '3D', exact: true }).click();
  const box = (await page.locator('canvas').boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2 + 30, { steps: 10 });
  await page.mouse.up();
  const canvasSize = async () => {
    const { width, height } = (await page.locator('canvas').boundingBox())!;
    return [Math.round(width), Math.round(height)];
  };
  const sizeBefore = await canvasSize();
  const before = await page.locator('canvas').screenshot();
  await page.getByLabel('Language', { exact: true }).selectOption('es');
  await page.getByRole('button', { name: 'Reproducir', exact: true }).waitFor();
  // The canvas may still be settling its layout right after the locale switch.
  await expect.poll(canvasSize).toEqual(sizeBefore);
  const after = await page.locator('canvas').screenshot();
  const fractionChanged = await page.evaluate(
    async (images) => {
      async function pixels(url: string) {
        const image = new Image();
        image.src = url;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d')!;
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, canvas.width, canvas.height).data;
      }
      const [a, b] = await Promise.all(images.map(pixels));
      if (a!.length !== b!.length) return 1;
      let changed = 0;
      for (let i = 0; i < a!.length; i++) if (Math.abs(a![i]! - b![i]!) > 8) changed++;
      return changed / a!.length;
    },
    [before, after].map((buffer) => `data:image/png;base64,${buffer.toString('base64')}`),
  );
  expect(fractionChanged).toBeLessThan(0.005);
  expect(errors).toEqual([]);
});

test('gallery filters, order and comparison live in the URL and survive a visit to a detail', async ({
  page,
}) => {
  await page.goto('/en/orbits');
  const filters = page.getByRole('navigation', { name: 'Filter and sort the orbits' });
  await filters.getByRole('link', { name: 'I.B', exact: true }).click();
  await expect(page).toHaveURL(/family=I\.B/);
  await expect(page.getByRole('status').filter({ hasText: 'orbits shown' })).toHaveText(
    '2 orbits shown',
  );
  await filters.getByRole('link', { name: 'Period', exact: true }).click();
  await page.getByRole('link', { name: 'Compare Goggles' }).click();
  await page.getByRole('link', { name: 'Compare Moth I' }).click();
  await expect(page).toHaveURL(/compare=goggles%2Cmoth-i/);
  await expect(page.getByRole('heading', { name: 'Side by side' })).toBeVisible();

  await page.locator('#orbit-moth-i').click();
  await expect(page).toHaveURL(/\/en\/orbits\/moth-i$/);
  await page.getByRole('link', { name: 'Back to gallery' }).click();
  await expect(page).toHaveURL(/family=I\.B&sort=period&compare=goggles%2Cmoth-i/);
  await expect(page.locator('#orbit-moth-i')).toBeFocused();
  await expect(filters.getByRole('link', { name: 'I.B', exact: true })).toHaveAttribute(
    'aria-current',
    'true',
  );

  await page.locator('#orbit-goggles').click();
  await expect(page).toHaveURL(/\/en\/orbits\/goggles$/);
  await page.goBack();
  await expect(page).toHaveURL(/family=I\.B&sort=period/);
  await expect(page.getByRole('heading', { name: 'Side by side' })).toBeVisible();

  await page.goto('/en/orbits?family=nope&sort=colour');
  await expect(page.getByRole('status').filter({ hasText: 'orbits shown' })).toHaveText(
    '6 orbits shown',
  );
});

test('playback controls are on screen without scrolling on a short desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/en/orbits/goggles');
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeInViewport({
    ratio: 1,
  });
  await expect(page.getByRole('slider', { name: 'Orbit timeline' })).toBeInViewport({ ratio: 1 });
  await expect(page.getByRole('group', { name: 'Goggles' })).toHaveAccessibleDescription(
    /sixteen close approaches/,
  );
  await page.getByRole('link', { name: /Next orbit/ }).click();
  await expect(page).toHaveURL(/\/en\/orbits\/moth-i$/);
});

test('an orbit opens in the Learn laboratory, and unknown orbits are ignored', async ({ page }) => {
  await page.goto('/en/orbits/butterfly-i');
  await page.getByRole('link', { name: 'Try it in the laboratory' }).click();
  await expect(page).toHaveURL(/\/en\/learn\?orbit=butterfly-i#lab$/);
  const lab = page.getByRole('region', { name: 'Free laboratory' });
  await expect(
    lab.getByText('Loaded from the gallery: Butterfly I.', { exact: false }),
  ).toBeVisible();
  await lab.getByRole('button', { name: 'Perturb 1%' }).click();
  await expect(lab.getByTestId('simulator-comparison')).toBeVisible();
  await page.goto('/en/learn?orbit=not-an-orbit#lab');
  await expect(page.getByRole('region', { name: 'Free laboratory' })).toBeVisible();
  await expect(page.getByText('Loaded from the gallery', { exact: false })).toHaveCount(0);
});
