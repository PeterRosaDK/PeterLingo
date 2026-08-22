import { expect, test } from '@playwright/test';

test('home shows one coherent five-subject experience', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Godmorgen, Peter/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Start dagens træning/ })).toBeVisible();
  for (const name of ['Doomsday', 'Roux', 'BCS → MBCS', 'Pi', 'Musikøre']) {
    await expect(page.getByRole('link', { name: new RegExp(name) })).toBeVisible();
  }
});

test('Doomsday exercise gives an answer and a progressive hint', async ({ page }) => {
  await page.goto('/fag/doomsday');
  await expect(page.getByRole('heading', { name: 'Doomsday', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Giv mig et hint' }).click();
  await expect(page.getByText('Århundredets anker', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'søndag' }).click();
  await expect(page.getByRole('status')).toBeVisible();
});

test('BCS drill uses real local card assets', async ({ page }) => {
  await page.goto('/fag/kort');
  await expect(page.getByRole('heading', { name: 'Kortene kommer tilbage' })).toBeVisible();
  const card = page.locator('.current-card img');
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute('src', /assets\/cards\/fronts/);
  await page.locator('.card-choices button').first().click();
  await expect(page.getByRole('status')).toBeVisible();
});

test('Pi has a non-prefix exercise and gap mode', async ({ page }) => {
  await page.goto('/fag/pi');
  await expect(page.getByText('Position 16–20')).toBeVisible();
  await page.getByRole('button', { name: 'Udfyld et hul' }).click();
  await expect(page.getByText('Position 24–28', { exact: true })).toBeVisible();
  await page.getByLabel('Skriv fem cifre').fill('33832');
  await page.getByRole('button', { name: 'Tjek' }).click();
  await expect(page.getByRole('status')).toContainText('overgang');
});

test('Roux mock state reaches the live move log', async ({ page }) => {
  await page.goto('/fag/roux');
  await expect(page.getByRole('heading', { name: 'Roux', exact: true })).toBeVisible();
  await page.locator('.cube-stage .move-pad button').first().click();
  await expect(page.locator('.move-history span')).toContainText('R');
  await page.getByRole('link', { name: 'Åbn GoCube-diagnostik' }).click();
  await expect(page.getByText(/fysisk GoCube endnu ikke verificeret/i)).toBeVisible();
});

test('Musikøre exposes interval practice and all four touch instruments', async ({ page }) => {
  await page.goto('/fag/musikoere');
  await expect(page.getByRole('heading', { name: 'Musikøre', exact: true })).toBeVisible();
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
