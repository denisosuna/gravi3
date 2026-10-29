import { expect, test } from '@playwright/test';

test('the deck moves capsule by capsule with buttons, dots and keys', async ({ page }) => {
  await page.goto('/en/learn');
  const deck = page.getByRole('navigation', { name: 'Capsules' });
  await expect(
    page.getByRole('heading', { name: 'Any two bodies attract each other' }),
  ).toBeVisible();
  await deck.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Same force, different motion' })).toBeFocused();
  await expect(page).toHaveURL(/#mutual$/);
  await page.getByRole('button', { name: /^Go to capsule 3:/ }).click();
  await expect(page).toHaveURL(/#numbers$/);
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('heading', { name: 'Same force, different motion' })).toBeFocused();
  await expect(page).toHaveURL(/#mutual$/);
  await expect(page.getByText('Two masses always attract each other.')).toBeVisible();
});

test('a capsule can be linked, and Back returns across chapters', async ({ page }) => {
  await page.goto('/en/learn#formula');
  await expect(page.getByRole('heading', { name: 'It all fits in one law' })).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Add a third body' })).toBeFocused();
  await expect(page).toHaveURL(/#third$/);
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'It all fits in one law' })).toBeVisible();
});

test('a prediction is checked against the inverse-square law', async ({ page }) => {
  await page.goto('/es/learn#pull');
  const force = page.getByTestId('force-value');
  const original = Number(await force.getAttribute('data-force'));
  await page.goto('/es/learn#predict');
  await page.getByRole('button', { name: 'Un cuarto', exact: true }).click();
  await expect(page.getByText(/^Exacto\./)).toBeVisible();
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await expect(page.getByText('Tu predicción: Un cuarto')).toBeVisible();
  await page.getByRole('button', { name: 'Duplicar la distancia' }).click();
  await expect(page.getByText('0,25 × la fuerza de la configuración inicial')).toBeVisible();
  await page.getByRole('link', { name: /Atracción/ }).click();
  await expect(page.getByRole('slider', { name: 'Distancia entre centros' })).toHaveValue('10');
  expect(Number(await force.getAttribute('data-force')) / original).toBeCloseTo(0.25);
  await page.getByLabel('Idioma', { exact: true }).selectOption('en');
  await expect(page.getByRole('slider', { name: 'Center-to-center distance' })).toHaveValue('10');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('the level changes which capsules appear and how numbers are shown', async ({ page }) => {
  await page.goto('/en/learn');
  const chapters = page.getByRole('navigation', { name: 'Lesson chapters' });
  await page.getByLabel('explorer').check();
  await expect(page.getByTestId('force-value')).toHaveText('1 × the force of the starting setup');
  await chapters.getByRole('link', { name: /Mass and distance/ }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('F = G · m₁ · m₂ / r²')).toBeHidden();
  await page.getByText('See the formula').click();
  await expect(page.getByText('F = G · m₁ · m₂ / r²')).toBeVisible();
  await page.getByLabel('advanced').check();
  await chapters.getByRole('link', { name: /Three bodies/ }).click();
  await page.getByRole('button', { name: 'Go to capsule 4: Energy gives the error away' }).click();
  await expect(page.getByRole('heading', { name: 'Energy gives the error away' })).toBeVisible();
  await page.getByLabel('explorer').check();
  await expect(page.getByRole('heading', { name: 'Add a third body' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Go to capsule/ })).toHaveCount(2);
  await page.getByLabel('advanced').check();
  await chapters.getByRole('link', { name: /Attraction/ }).click();
  await expect(page.getByTestId('force-value')).toContainText('N');
});

test('the gravitational fall follows Newtonian motion and leaves setup measurements untouched', async ({
  page,
}) => {
  await page.goto('/es/learn#mutual');
  await page.getByRole('button', { name: 'Ver cómo caen por gravedad' }).click();
  await expect(page.getByRole('button', { name: 'Simulación en curso…' })).toBeDisabled();
  await expect(
    page.getByText(/Tras .+ de tiempo simulado, los cuerpos se acercan mucho/),
  ).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('button', { name: 'Repetir la caída' })).toBeEnabled();
  const mass = page.getByRole('slider', { name: 'Masa del cuerpo 2' });
  await expect(mass).toHaveValue('100');
  await mass.press('ArrowRight');
  await expect(
    page.getByText('El cuerpo 1 tiene menos masa: con la misma fuerza, su movimiento cambia más.'),
  ).toBeVisible();
  await expect(page.getByText(/Pulsa para simular en una dimensión/)).toBeVisible();
});

test('reduced-motion preference presents a still version of the physical fall', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/es/learn#mutual');
  await page.getByRole('button', { name: 'Ver cómo caen por gravedad' }).click();
  await expect(
    page.getByText(/Vista estática de la caída calculada tras .+ de tiempo simulado/),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Volver a la posición inicial' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Volver a la posición inicial' }).click();
  await expect(page.getByRole('button', { name: 'Ver cómo caen por gravedad' })).toBeVisible();
});

test('the chapter rail tracks progress and reaches the tutor', async ({ page }) => {
  await page.goto('/en/learn#check');
  const chapters = page.getByRole('navigation', { name: 'Lesson chapters' });
  await expect(chapters.getByRole('link', { name: /Mass and distance/ })).toHaveAttribute(
    'aria-current',
    'step',
  );
  await chapters.getByRole('link', { name: /Three bodies/ }).click();
  await expect(page).toHaveURL(/#third$/);
  await chapters.getByRole('link', { name: 'Ask the tutor' }).click();
  await expect(page.getByRole('heading', { name: 'AI tutor' })).toBeInViewport();
  await expect(page).toHaveURL(/#third$/);
});
