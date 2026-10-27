import { expect, test } from '@playwright/test';

test('the tutor sends actual experiment context and renders provider text safely', async ({
  page,
}) => {
  let submitted: Record<string, unknown> | undefined;
  await page.route('**/api/tutor', async (route) => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { enabled: true } });
    submitted = route.request().postDataJSON();
    return route.fulfill({
      json: { reply: 'Doubling distance quarters force. <script>unsafe()</script>' },
    });
  });
  await page.goto('/en/learn');
  await page.getByLabel('Your question', { exact: true }).fill('What happens to force?');
  await page.getByRole('button', { name: 'Ask', exact: true }).click();
  await expect(page.getByRole('log')).toContainText('Doubling distance quarters force.');
  expect(submitted?.context).toMatchObject({
    kind: 'learning',
    mass1: 100,
    mass2: 100,
    distance: 5,
  });
  expect(submitted?.context).not.toHaveProperty('force');
  await expect(page.getByRole('log').locator('script')).toHaveCount(0);
});

test('a provider limit is visible and the experiment remains usable', async ({ page }) => {
  await page.route('**/api/tutor', (route) =>
    route.fulfill(
      route.request().method() === 'GET'
        ? { json: { enabled: true } }
        : { status: 429, json: { error: 'rate_limited' }, headers: { 'Retry-After': '60' } },
    ),
  );
  await page.goto('/en/learn');
  await page.getByRole('button', { name: 'What happens if I double the distance?' }).click();
  await expect(page.getByText(/^The usage limit has been reached/)).toBeVisible();
  await page.getByRole('button', { name: 'Double the distance', exact: true }).click();
  await expect(page.getByRole('slider', { name: 'Center-to-center distance' })).toHaveValue('10');
});

test('reduced mode is explicit without replacing AI replies with static content', async ({
  page,
}) => {
  await page.route('**/api/tutor', (route) => route.fulfill({ json: { enabled: false } }));
  await page.goto('/en/learn');
  await expect(page.getByText('Reduced tutor mode.', { exact: false })).toBeVisible();
  await expect(page.getByLabel('Your question', { exact: true })).toBeDisabled();
  await expect(page.getByRole('log')).toBeEmpty();
  await page.getByRole('button', { name: 'Double the first mass' }).click();
  await expect(page.getByRole('slider', { name: 'Body 1 mass' })).toHaveValue('200');
});

test('the tutor proposes experiments that run with one click', async ({ page }) => {
  await page.route('**/api/tutor', (route) =>
    route.fulfill(
      route.request().method() === 'GET'
        ? { json: { enabled: true } }
        : {
            json: {
              reply: 'Press Try it to double the distance, then watch chaos.',
              actions: [
                { type: 'setExperiment', distance: 10 },
                { type: 'loadPreset', preset: 'pythagorean' },
              ],
            },
          },
    ),
  );
  await page.goto('/en/learn');
  await page.getByRole('button', { name: 'Why are three bodies unpredictable?' }).click();
  const experiments = page.getByRole('list', { name: 'Suggested experiments' });
  await experiments.getByRole('button', { name: 'Try it: r = 10 m' }).click();
  await expect(page.getByRole('slider', { name: 'Center-to-center distance' })).toHaveValue('10');
  await experiments.getByRole('button', { name: 'Try it: Pythagorean in the simulator' }).click();
  const simulator = page.getByRole('region', { name: 'Add a third body' });
  await expect(simulator.getByRole('button', { name: /^Pythagorean/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(simulator.getByRole('button', { name: 'Pause' })).toBeVisible();
});

test('on an orbit page the tutor can move the player to the closest approach', async ({ page }) => {
  await page.route('**/api/tutor', (route) =>
    route.fulfill(
      route.request().method() === 'GET'
        ? { json: { enabled: true } }
        : {
            json: {
              reply: 'Press Try it to jump to the closest approach and slow down.',
              actions: [
                { type: 'seekOrbit', fraction: 0.5 },
                { type: 'setOrbitSpeed', speed: 0.5 },
              ],
            },
          },
    ),
  );
  await page.goto('/en/orbits/butterfly-i');
  const timeline = page.getByRole('slider', { name: 'Orbit timeline' });
  await expect(timeline).toHaveValue('0');
  await page.getByRole('button', { name: 'Is this orbit stable?' }).click();
  const experiments = page.getByRole('list', { name: 'Suggested experiments' });
  await expect(experiments.getByRole('button')).toHaveCount(2);
  await expect(timeline).toHaveValue('0');
  await experiments.getByRole('button', { name: 'Try it: go to 50% of the period' }).click();
  expect(Number(await timeline.inputValue())).toBeCloseTo(6.2346748391 / 2, 3);
  await experiments.getByRole('button', { name: 'Try it: play at 0.5×' }).click();
  await expect(page.getByRole('combobox', { name: 'Speed' })).toHaveValue('0.5');
});
