import { expect, test } from '@playwright/test';

test('home shows one coherent five-subject experience', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Godmorgen, Peter/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Start dagens træning/ })).toBeVisible();
  for (const name of ['Doomsday', 'Roux', 'BCS → MBCS', 'Pi', 'Hørelære']) {
    await expect(page.getByRole('link', { name: new RegExp(name) })).toBeVisible();
  }
});

test('Doomsday exercise gives an answer and a progressive hint', async ({ page }) => {
  await page.goto('/fag/doomsday');
  await expect(page.getByRole('heading', { name: 'Doomsday', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sådan finder du ugedagen' })).toBeVisible();
  await expect(page.getByText('23. august 2026')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Hvilket tal|Hvilken ugedag/ })).toBeVisible();
  await page.getByRole('button', { name: /Hele datoen/ }).click();
  await page.getByRole('button', { name: 'Giv mig et hint' }).click();
  await expect(page.getByText('Start med århundredet', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'søndag', exact: true }).click();
  await expect(page.getByRole('status')).toBeVisible();
});

test('Osterlind BCS curriculum uses real local card assets', async ({ page }) => {
  await page.goto('/fag/kort');
  await expect(page.getByRole('heading', { name: 'Kortene kommer tilbage' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Hvad er kulørværdien?' })).toBeVisible();
  await expect(page.getByText('Spar', { exact: true })).toBeVisible();
  await page.getByText('Vis hele BCS-rækkefølgen · 52 kort').click();
  await expect(page.locator('.bcs-stack-grid li')).toHaveCount(52);
  await expect(page.getByText(/begynd med nummer 52/i)).toBeVisible();
  await page.getByRole('button', { name: /Næste kort.*Sæt værdi/ }).click();
  await expect(page.getByRole('heading', { name: /Hvilket kort følger efter/ })).toBeVisible();
  const card = page.locator('.cards-practice-visual img');
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute('src', /assets\/cards\/fronts/);
  await page.locator('.card-choices button').first().click();
  await expect(page.getByRole('status')).toBeVisible();
});

test('Pi starts at 30 and opens only the next five digits', async ({ page }) => {
  await page.goto('/fag/pi');
  await expect(page.locator('.pi-reference .digit-ribbon')).not.toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sikkert arbejde til decimal 30' })).toBeVisible();
  await page.getByRole('button', { name: /Styrk det kendte/ }).click();
  const range = await page.locator('.exercise-shell .eyebrow').textContent();
  expect(Number(range?.match(/–(\d+)/)?.[1])).toBeLessThanOrEqual(30);
  await page.getByRole('button', { name: /Lær næste fem/ }).click();
  await expect(page.getByText(/Ny blok · position 31–35/)).toBeVisible();
  await expect(page.locator('.pi-study-sequence strong')).toHaveText('50288');
});

test('Pi acknowledges every correct digit in an unfinished block', async ({ page }) => {
  await page.goto('/fag/pi');
  await page.getByRole('button', { name: /Lær næste fem/ }).click();
  await page.getByRole('button', { name: 'Skjul og prøv selv' }).click();
  await page.getByLabel('Skriv fem cifre').fill('50289');
  await page.getByRole('button', { name: 'Tjek' }).click();
  await expect(page.getByRole('status')).toContainText('4 af 5 cifre sad rigtigt');
});

test('Pi prefix run stops at the first wrong digit without showing the answer', async ({
  page,
}) => {
  await page.goto('/fag/pi');
  const input = page.getByLabel('Decimaler af pi fra begyndelsen');
  await input.fill('14158');
  await expect(page.getByRole('status')).toContainText('Stop ved decimal 5');
  await expect(page.locator('.prefix-score strong')).toHaveText('4');
  await expect(input).toBeDisabled();
});

test('daily stars reward practice rather than correctness', async ({ page }) => {
  await page.goto('/fag/pi');
  await page.getByLabel('Decimaler af pi fra begyndelsen').fill('14158');
  await expect(page.getByRole('status')).toContainText('Stop ved decimal 5');
  await page.getByRole('link', { name: 'I dag' }).click();
  const piCard = page.getByRole('link', { name: /Pi.*Udvid sikre bidder/i });
  await expect(piCard.getByLabel('1 af 3 stjerner i dag')).toBeVisible();
});

test('Roux mock state reaches the live move log', async ({ page }) => {
  await page.goto('/fag/roux');
  await expect(page.getByRole('heading', { name: 'Roux', exact: true })).toBeVisible();
  const fullscreenAvailable = await page
    .locator('.cube-stage')
    .evaluate((element) => Boolean((element as HTMLElement).requestFullscreen));
  if (fullscreenAvailable)
    await expect(page.getByRole('button', { name: /Terning \+ træk i fuld skærm/ })).toBeVisible();
  await expect(page.getByText('Beacio skal ikke installeres på Mac.')).toBeVisible();
  await page.locator('.cube-stage .move-pad button').first().click();
  await expect(page.locator('.move-history span')).toContainText('R');
  const handDrill = page.locator('.roux-move-drill');
  for (const move of ['R', 'U', "R'"])
    await handDrill.getByRole('button', { name: move, exact: true }).click();
  await expect(handDrill.getByRole('status')).toContainText('Sekvensen sad rigtigt');
  await page.getByRole('link', { name: 'Åbn GoCube-diagnostik' }).click();
  await expect(page.getByText(/fysisk GoCube endnu ikke verificeret/i)).toBeVisible();
});

test('Hørelære exposes interval practice and all four touch instruments', async ({ page }) => {
  await page.goto('/fag/hoerelaere');
  await expect(page.getByRole('heading', { name: 'Hørelære', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Lille terts' }).click();
  await expect(page.getByRole('status')).toBeVisible();
  for (const tab of ['Klaver', 'Guitar', 'Bas', 'Cello'])
    await expect(page.getByRole('tab', { name: tab })).toBeVisible();
  await page.getByRole('tab', { name: 'Cello' }).click();
  await expect(page.getByLabel('Virtuelt cellofingerbræt')).toBeVisible();
});

test('settings persist through IndexedDB reload', async ({ page }) => {
  await page.goto('/indstillinger');
  await page.getByRole('button', { name: 'Mørkt' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('production PWA reopens its home shell offline', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium');
  await page.goto('/');
  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifestHref).toBeTruthy();
  const manifest = await page.request.get(manifestHref!);
  expect(manifest.ok()).toBe(true);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.context().setOffline(true);
  try {
    await page.reload();
    await expect(page.getByRole('heading', { name: /Godmorgen, Peter/ })).toBeVisible();
  } finally {
    await page.context().setOffline(false);
  }
});

test('mobile navigation stays touch accessible', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Hovednavigation' });
  await expect(nav).toBeVisible();
  await expect(nav.getByRole('link', { name: /Indstillinger/ })).toBeVisible();
  await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll');
});
