import { expect, test } from '@playwright/test';

test('experiment demonstrates inverse-square gravity and evaluates a prediction', async ({
  page,
}) => {
  await page.goto('/es/learn');
  await expect(page.getByTestId('force-lab-scene').locator('canvas')).toBeVisible();
  const force = page.getByTestId('force-value');
  const original = Number(await force.getAttribute('data-force'));
  await page.getByRole('button', { name: 'Duplicar la distancia' }).click();
  expect(Number(await force.getAttribute('data-force')) / original).toBeCloseTo(0.25);
  await expect(page.getByText('0,25 × la fuerza de la configuración inicial')).toBeVisible();
  await page.getByRole('button', { name: 'Un cuarto', exact: true }).click();
  await expect(page.getByText(/^Exacto\./)).toBeVisible();
  await page.getByLabel('Idioma', { exact: true }).selectOption('en');
  await expect(page.getByRole('slider', { name: 'Center-to-center distance' })).toHaveValue('10');
  await expect(page.getByRole('button', { name: 'One quarter' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Double the first mass' }).click();
  expect(Number(await force.getAttribute('data-force')) / original).toBeCloseTo(0.5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('the experiment explains the two-body interaction before showing optional calculations', async ({
  page,
}) => {
  await page.goto('/es/learn');
  await expect(page.getByRole('heading', { name: 'Qué está pasando' })).toBeVisible();
  await expect(
    page.getByText('Hay solo dos cuerpos a propósito: así aislamos esta interacción.'),
  ).toBeVisible();
  await expect(
    page.getByText(
      'Cuanto más lejos están, más débil es la atracción. Si duplicas la distancia, queda en una cuarta parte.',
    ),
  ).toBeVisible();
  await expect(page.getByText(/^a₁ =/)).toBeHidden();
  await page.getByRole('slider', { name: 'Masa del cuerpo 2' }).press('ArrowRight');
  await expect(
    page.getByText('El cuerpo 1 tiene menos masa: con la misma fuerza, su movimiento cambia más.'),
  ).toBeVisible();
  await page.getByText('Ver los valores de aceleración').click();
  await expect(page.getByText(/^a₁ =/)).toBeVisible();
});

test('the gravitational fall follows Newtonian motion and leaves setup measurements untouched', async ({
  page,
}) => {
  await page.goto('/es/learn');
  const distance = page.getByRole('slider', { name: 'Distancia entre centros' });
  const force = page.getByTestId('force-value');
  const originalForce = Number(await force.getAttribute('data-force'));
  await page.getByRole('button', { name: 'Ver cómo caen por gravedad' }).click();
  await expect(page.getByRole('button', { name: 'Simulación en curso…' })).toBeDisabled();
  await expect(
    page.getByText(
      'Las flechas crecen al acercarse. La fuerza indicada es la inicial; el tiempo de simulación está acelerado.',
      { exact: true },
    ),
  ).toHaveCount(1);
  await expect(
    page.getByText(/Tras .+ de tiempo simulado, los cuerpos se acercan mucho/),
  ).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('button', { name: 'Repetir la caída' })).toBeEnabled();
  await expect(distance).toHaveValue('5');
  expect(Number(await force.getAttribute('data-force'))).toBe(originalForce);
  await distance.press('ArrowRight');
  await expect(distance).toHaveValue('5.5');
  await expect(page.getByText(/Pulsa para simular en una dimensión/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ver cómo caen por gravedad' })).toBeEnabled();
});

test('reduced-motion preference presents a still version of the physical fall', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/es/learn');
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

test('the lesson rail follows the steps and the check step recalls the prediction', async ({
  page,
}) => {
  await page.goto('/en/learn');
  const rail = page.getByRole('navigation', { name: 'Lesson steps' });
  await expect(rail.getByRole('link', { name: /Observe/ })).toHaveAttribute('aria-current', 'step');
  await page.getByRole('button', { name: 'One quarter', exact: true }).click();
  await rail.getByRole('link', { name: /Check/ }).click();
  await expect(page).toHaveURL(/#check$/);
  await expect(rail.getByRole('link', { name: /Check/ })).toHaveAttribute('aria-current', 'step');
  await expect(page.getByText('Your prediction: One quarter')).toBeVisible();
  await page.getByRole('link', { name: 'Ask the tutor' }).click();
  await expect(page.getByRole('heading', { name: 'AI tutor' })).toBeInViewport();
});
