import { expect, test } from '@playwright/test';

test('home shows one coherent five-subject experience', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /(Godnat|Godmorgen|Goddag|Godaften), Peter/ })
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /Start dagens træning/ })).toBeVisible();
  for (const name of ['Doomsday', 'Roux', 'BCS → MBCS', 'Pi', 'Hørelære']) {
    await expect(page.getByRole('link', { name: new RegExp(name) })).toBeVisible();
  }
});

test('daily session explains why each learning unit was selected', async ({ page }) => {
  await page.goto('/session');
  await expect(page.getByRole('heading', { name: /af \d+ stop tilbage/ })).toBeVisible();
  await expect(page.locator('.session-reason').first()).toHaveText('Næste lille nye trin');
  await expect(page.getByRole('link', { name: /Begynd første øvelse/ })).toBeVisible();
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
  const activeStep = await page.locator('.exercise-shell .eyebrow').textContent();
  await page.getByRole('button', { name: 'søndag', exact: true }).click();
  await expect(page.getByRole('status')).toBeVisible();
  await expect(page.locator('.doomsday-answers .correct-answer')).toHaveCount(1);
  await expect(page.locator('.doomsday-answers [aria-pressed="true"]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Ny opgave i samme trin' }).click();
  await expect(page.locator('.exercise-shell .eyebrow')).toHaveText(activeStep ?? '');
  await expect(page.locator('.doomsday-answers [aria-pressed="true"]')).toHaveCount(0);
});

test('adaptive recommendation does not replace an active Doomsday question', async ({ page }) => {
  await page.goto('/fag/doomsday');
  const step = await page.locator('.exercise-shell .eyebrow').textContent();
  await expect(page.locator('.doomsday-answers [aria-pressed="true"]')).toHaveCount(0);
  await page.locator('.doomsday-answers button').first().click();
  await expect(page.getByRole('status')).toBeVisible();
  await expect(page.locator('.exercise-shell .eyebrow')).toHaveText(step ?? '');
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
  const activeStep = await page.locator('.exercise-shell .eyebrow').textContent();
  await page.locator('.card-choices button').first().click();
  await expect(page.getByRole('status')).toBeVisible();
  await expect(page.locator('.card-choices .correct-answer')).toHaveCount(1);
  await expect(page.locator('.card-choices [aria-pressed="true"]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Ny opgave i samme trin' }).click();
  await expect(page.locator('.exercise-shell .eyebrow')).toHaveText(activeStep ?? '');
  await expect(page.locator('.card-choices [aria-pressed="true"]')).toHaveCount(0);
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
  const input = page.getByLabel('Skriv fem cifre');
  await expect(input).toBeFocused();
  await input.fill('50289');
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

test('Roux presents the physical reference grip and keeps the notation drill', async ({ page }) => {
  await page.goto('/fag/roux');
  await expect(page.getByRole('heading', { name: 'Roux', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Hvid GO-side mod dig' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Forbind og kontrollér GoCube' })).toBeVisible();
  await expect(page.getByText('Beacio skal ikke installeres på Mac.')).toBeVisible();
  const handDrill = page.locator('.roux-move-drill');
  for (const move of ['R', 'U', "R'"])
    await handDrill.getByRole('button', { name: move, exact: true }).click();
  await expect(handDrill.getByRole('status')).toContainText('Sekvensen sad rigtigt');
  await page.getByRole('link', { name: 'Åbn GoCube-diagnostik' }).click();
  await expect(page.getByText(/fysisk forbindelse bekræftet/i)).toBeVisible();
});

test('GoCube diagnostics exposes only the physical connection flow', async ({ page }) => {
  await page.goto('/fag/roux/diagnostik');
  await expect(page.getByRole('heading', { name: /Hvid GO-side mod dig/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Find og forbind GoCube' })).toBeVisible();
  await expect(page.getByText('Husket af browseren')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sådan taler GoCube' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start måling af R' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Læs cuben igen' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Læs cuben igen' })).toBeDisabled();
  await expect(
    page.getByText('Forbind GoCube ovenfor for at aktivere genaflæsningen.')
  ).toBeVisible();
  await expect(page.getByText(/derefter M\/M′/)).toBeVisible();
  await expect(page.getByRole('button', { name: /Mock/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Nulstil efter fysisk løsning/ })).toHaveCount(0);
});

test('Roux notation help distinguishes prime from the number one and explains M', async ({
  page,
}) => {
  await page.goto('/fag/roux/notation');
  await expect(page.getByRole('heading', { name: 'Cubens alfabet' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'R, R′ og R2 er ikke det samme' })).toBeVisible();
  await expect(page.getByText('Er det R1?')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'M er det lodrette midterlag' })).toBeVisible();
  await expect(page.getByText(/M-laget ligger mellem L og R/)).toBeVisible();
  await page.getByRole('link', { name: 'Tilbage til GoCube-målingen' }).click();
  await expect(page.getByRole('heading', { name: 'GoCube-diagnostik' })).toBeVisible();
});

test('manual cube state entry cycles stickers and reports color-count differences', async ({
  page,
}) => {
  await page.goto('/fag/roux/diagnostik');
  await page.getByRole('link', { name: 'Indtast den fysiske tilstand manuelt' }).click();
  await expect(
    page.getByRole('heading', { name: 'Fortæl hvordan cuben faktisk ser ud' })
  ).toBeVisible();
  await expect(page.getByText('9 af hver farve')).toBeVisible();

  await page.getByRole('button', { name: 'Hvid side, øverst til venstre: hvid' }).click();
  await expect(page.getByText('Farveantal stemmer ikke endnu')).toBeVisible();
  await expect(page.getByText(/rød:/)).toContainText('10/9');
  await expect(page.getByText(/hvid:/)).toContainText('8/9');
  await page.getByText('Vis teknisk kode til fejlsøgning').click();
  expect(await page.getByLabel('Teknisk 54-tegnskode').inputValue()).toMatch(/^RU{8}R{9}/);
});

test('Hørelære teaches, tests all three presentations, and exposes four instruments', async ({
  page,
}) => {
  await page.goto('/fag/hoerelaere');
  await expect(page.getByRole('heading', { name: 'Hørelære', exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Et interval er en afstand, ikke to bestemte toner' })
  ).toBeVisible();
  for (let step = 0; step < 3; step += 1)
    await page.getByRole('button', { name: 'Næste lille skridt' }).click();
  await expect(
    page.getByRole('heading', { name: 'Melodisk op, melodisk ned og harmonisk' })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Gå til dagens test' }).click();
  const roundMap = page.getByLabel('Dagens tre intervalformer');
  for (const presentation of ['melodisk opad', 'melodisk nedad', 'harmonisk'])
    await expect(roundMap.getByText(presentation, { exact: true })).toBeVisible();

  for (let question = 1; question <= 3; question += 1) {
    await expect(page.locator('.exercise-shell .eyebrow')).toContainText(`${question} af 3`);
    await page.locator('.answer-grid.intervals button').first().click();
    await expect(page.getByRole('status')).toBeVisible();
    await page
      .getByRole('button', {
        name: question === 3 ? 'Se dagens resultat' : 'Næste interval',
      })
      .click();
  }
  await expect(
    page.getByRole('heading', { name: 'Du lyttede dig gennem alle tre former' })
  ).toBeVisible();

  for (const tab of ['Klaver', 'Guitar', 'Bas', 'Cello'])
    await expect(page.getByRole('tab', { name: tab })).toBeVisible();
  await page.getByRole('tab', { name: 'Cello' }).click();
  await expect(page.getByLabel('Virtuelt cellofingerbræt')).toBeVisible();

  await page.getByRole('link', { name: 'I dag' }).click();
  const earCard = page.getByRole('link', { name: /Hørelære.*Lær intervallet roligt/i });
  await expect(earCard.getByLabel('3 af 3 stjerner i dag')).toBeVisible();
  await earCard.click();
  await expect(page.getByRole('button', { name: /Dagens test/ })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
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
    await expect(
      page.getByRole('heading', { name: /(Godnat|Godmorgen|Goddag|Godaften), Peter/ })
    ).toBeVisible();
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
