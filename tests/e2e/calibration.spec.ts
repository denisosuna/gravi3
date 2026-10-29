import { expect, test } from '@playwright/test';

test('the calibration places the learner and Learn remembers the level in the session', async ({
  page,
}) => {
  await page.goto('/es/learn');
  await page.getByRole('link', { name: 'Calibrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: '¿Cuánta física has estudiado?' })).toBeFocused();
  const confirm = page.getByRole('button', { name: 'Confirmar respuesta' });
  await expect(confirm).toBeDisabled();
  for (const answer of [
    'La del instituto',
    'Iguales y opuestas',
    'Las dos a la vez',
    'Cae deprisa y luego despacio',
    'Se separarán hasta parecer distintas',
  ]) {
    await page.getByLabel(answer).check();
    const finish = page.getByRole('button', { name: 'Ver mi punto de partida' });
    await ((await finish.isVisible()) ? finish : confirm).click();
  }
  await expect(page.getByRole('heading', { name: 'Empiezas como avanzado' })).toBeFocused();
  await expect(
    page.getByText('Nada pendiente: puedes ir directo a los tres cuerpos.'),
  ).toBeVisible();
  await page.getByLabel('estudiante').check();
  await expect(page.getByRole('heading', { name: 'Empiezas como estudiante' })).toBeVisible();
  await page.getByRole('link', { name: 'Empezar a aprender' }).click();
  await expect(page.getByText('Tu nivel: estudiante')).toBeVisible();
});

test('unknown answers lead to the explorer level with links to review', async ({ page }) => {
  await page.goto('/en/learn/calibration');
  await page.getByLabel('None or almost none').check();
  await page.getByRole('button', { name: 'Confirm answer' }).click();
  for (let question = 0; question < 4; question += 1) {
    await page.getByLabel("I don't know").check();
    await page.getByRole('button', { name: /Confirm answer|See my starting point/ }).click();
  }
  await expect(page.getByRole('heading', { name: 'You start as explorer' })).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Why a tiny change changes everything' }),
  ).toBeVisible();
});
