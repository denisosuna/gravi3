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
  await page
    .getByRole('button', { name: 'Can you explain gravity with a simple example?' })
    .click();
  await expect(page.getByText(/^The usage limit has been reached/)).toBeVisible();
  await page.getByRole('slider', { name: 'Center-to-center distance' }).press('End');
  await expect(page.getByRole('slider', { name: 'Center-to-center distance' })).toHaveValue('20');
});

test('reduced mode is explicit without replacing AI replies with static content', async ({
  page,
}) => {
  await page.route('**/api/tutor', (route) => route.fulfill({ json: { enabled: false } }));
  await page.goto('/en/learn');
  await expect(page.getByText('Reduced tutor mode.', { exact: false })).toBeVisible();
  await expect(page.getByLabel('Your question', { exact: true })).toBeDisabled();
  await expect(page.getByRole('log')).toBeEmpty();
  await page.getByRole('slider', { name: 'Body 1 mass' }).press('ArrowRight');
  await expect(page.getByRole('slider', { name: 'Body 1 mass' })).toHaveValue('150');
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
  await expect(page).toHaveURL(/#lab$/);
  const simulator = page.getByRole('region', { name: 'Free laboratory' });
  await expect(simulator.getByRole('button', { name: /^Pythagorean/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(simulator.getByRole('button', { name: 'Pause' })).toBeVisible();
});

test('the tutor runs a "what if" on one body and the original stays as a ghost', async ({
  page,
}) => {
  await page.route('**/api/tutor', (route) =>
    route.fulfill(
      route.request().method() === 'GET'
        ? { json: { enabled: true } }
        : {
            json: {
              reply: 'Press Try it to make body 2 faster and compare with the original.',
              actions: [{ type: 'scaleBodyVelocity', body: 2, factor: 1.2 }],
            },
          },
    ),
  );
  await page.goto('/en/learn');
  await page.getByLabel('Your question', { exact: true }).fill('What if body 2 were faster?');
  await page.getByRole('button', { name: 'Ask', exact: true }).click();
  await page.getByRole('button', { name: 'Try it: body 2 velocity × 1.2' }).click();
  await expect(page).toHaveURL(/#lab$/);
  const lab = page.getByRole('region', { name: 'Free laboratory' });
  await expect(lab.getByRole('button', { name: 'Pause' })).toBeVisible();
  await expect(lab.getByTestId('simulator-comparison')).toContainText('Largest gap right now');
  await lab.getByRole('button', { name: /^Figure eight/ }).click();
  await expect(lab.getByTestId('simulator-comparison')).toHaveCount(0);
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

test('orbit suggestions are specific to the orbit being viewed', async ({ page }) => {
  await page.route('**/api/tutor', (route) => route.fulfill({ json: { enabled: true } }));
  const contextualQuestions = [
    { slug: 'lagrange', question: '¿Por qué los tres mantienen un triángulo?' },
    { slug: 'figure-eight', question: '¿Por qué los tres recorren la misma curva?' },
    { slug: 'butterfly-i', question: '¿Qué ocurre cuando dos cuerpos pasan muy cerca?' },
    { slug: 'goggles', question: '¿Cómo se conectan los lazos de esta órbita?' },
    { slug: 'moth-i', question: '¿Qué patrón siguen los cuerpos en esta órbita?' },
    { slug: 'yin-yang-i', question: '¿Por qué esta órbita parece tener dos mitades?' },
  ];
  for (const { slug, question } of contextualQuestions) {
    await page.goto(`/es/orbits/${slug}`);
    const suggestions = page.getByRole('list', { name: 'Preguntas sugeridas' });
    await expect(suggestions.getByRole('button')).toHaveCount(3);
    await expect(suggestions.getByRole('button').nth(2)).toHaveText(question);
    await expect(
      suggestions.getByRole('button', { name: '¿En qué se diferencia de la figura de ocho?' }),
    ).toHaveCount(0);
  }
});
