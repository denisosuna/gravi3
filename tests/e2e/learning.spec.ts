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
