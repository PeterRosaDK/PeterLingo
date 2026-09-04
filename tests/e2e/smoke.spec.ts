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
  const homeCube = page.getByLabel('Interaktiv 3D Rubiks terning');
  await homeCube.scrollIntoViewIfNeeded();
  await expect(homeCube).toBeVisible();
  await expect
    .poll(() =>
      homeCube.locator('twisty-player').evaluate(async (player) => {
        const twistyPlayer = player as HTMLElement & {
          experimentalCurrentCanvases(): Promise<HTMLCanvasElement[]>;
        };
        return (await twistyPlayer.experimentalCurrentCanvases()).length;
      })
    )
    .toBe(1);
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

test('Roux opens directly in the pedagogical training path', async ({ page }) => {
  await page.goto('/fag/roux');
  await expect(page.getByRole('heading', { name: 'Træn med din cube' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'De fire Roux-faser' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Start fase 1: First Block' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Hjælp', exact: true })).toBeVisible();
  const liveCube = page.getByLabel('Interaktiv 3D Rubiks terning');
  await expect(liveCube).toBeVisible();
  await expect(page.getByRole('button', { name: 'Kalibrer 3D' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Tilslut' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Synkronisér farver' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Ret farver manuelt' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Løs hurtigt' })).toBeDisabled();
  await expect
    .poll(() =>
      liveCube.locator('twisty-player').evaluate(async (player) => {
        const twistyPlayer = player as HTMLElement & {
          experimentalCurrentCanvases(): Promise<HTMLCanvasElement[]>;
        };
        return (await twistyPlayer.experimentalCurrentCanvases()).length;
      })
    )
    .toBe(1);
  await expect(page.getByRole('link', { name: 'Opsætning', exact: true })).toHaveCount(0);
  await expect(page.getByText('Fysisk GoCube')).toHaveCount(0);
  await expect(page.getByText('Dagens håndtræning')).toHaveCount(0);

  await page.getByRole('button', { name: 'Ret farver manuelt' }).click();
  await expect(
    page.getByRole('heading', { name: 'Ret farverne efter den fysiske cube' })
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Indtast én side ad gangen' })).toBeVisible();
  await page.getByRole('button', { name: 'Tilbage til faserne' }).click();
  await expect(page.getByRole('heading', { name: 'De fire Roux-faser' })).toBeVisible();
});

test('Roux workbench has no horizontal overflow at iPad-like sizes', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium');
  for (const viewport of [
    { width: 820, height: 1180 },
    { width: 1180, height: 820 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/fag/roux');
    await expect(page.getByRole('heading', { name: 'Træn med din cube' })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
      )
    ).toBe(true);
  }
});

test('First Block compares the live cube with two fixed 3D goals and keeps manual fallback', async ({
  page,
}) => {
  await page.goto('/fag/roux/first-block');
  await expect(page.getByRole('heading', { name: 'First Block', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Det GoCube ser lige nu' })).toBeVisible();
  await expect(page.getByLabel('Interaktiv 3D Rubiks terning').first()).toBeVisible();
  await expect(page.getByLabel('Delmål i 3D: Forreste firkant')).toBeVisible();
  await expect(page.getByText('gul-orange-grøn')).toBeVisible();
  await expect(page.getByText('30 sekunder')).toHaveCount(0);

  await page.getByRole('tab', { name: /Hele First Block/ }).click();
  await expect(page.getByLabel('Delmål i 3D: Hele First Block')).toBeVisible();
  await expect(page.getByText('gul-orange-blå', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Start uden GoCube' }).click();
  await page.getByRole('button', { name: 'Min First Block er samlet' }).click();
  await expect(page.getByText('First Block gennemført')).toBeVisible();
});

test('Second Block preserves fixed colors and keeps the starter repertoire small', async ({
  page,
}) => {
  await page.goto('/fag/roux/second-block');
  await expect(page.getByRole('heading', { name: 'Second Block', level: 1 })).toBeVisible();
  await expect(page.getByText('Rød til højre · gul i bunden')).toBeVisible();
  await expect(page.getByText(/R, U, R′ og U2/)).toBeVisible();
  await expect(page.getByLabel('Aktuel øvelsesblanding')).toContainText(/^[RU2′ ]+$/);

  for (let step = 0; step < 4; step += 1) {
    await page.getByRole('button', { name: 'Næste delmål' }).click();
  }
  const tools = page.locator('.beginner-trigger-grid');
  await expect(tools.getByText('R U R′')).toBeVisible();
  await expect(tools.getByText('R U′ R′')).toBeVisible();
  await expect(page.getByText('r U r′ · r U′ r′', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Jeg er klar til Second Block' }).click();

  await page.getByRole('button', { name: 'Start uden GoCube' }).click();
  await page.getByRole('button', { name: 'Begge blokke er samlet' }).click();
  await expect(page.getByText('Second Block gennemført')).toBeVisible();
  await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll');
});

test('beginner CMLL teaches two looks with exactly two standard-notation algorithms', async ({
  page,
}) => {
  await page.goto('/fag/roux/cmll');
  await expect(page.getByRole('heading', { name: 'Begynder-CMLL', level: 1 })).toBeVisible();
  await expect(page.getByText(/hvid CMLL-farven/)).toBeVisible();
  await expect(page.getByRole('tab', { name: /Kig 1 · orientering/ })).toHaveAttribute(
    'aria-selected',
    'true'
  );

  await page.getByRole('button', { name: 'Næste kig' }).click();
  await expect(page.getByText('Orientér')).toBeVisible();
  await expect(page.getByText('Permutér')).toBeVisible();
  await page.getByRole('button', { name: 'Næste kig' }).click();
  await expect(page.locator('.cmll-algorithm-card')).toContainText('R U R′ U R U2 R′');
  await page.getByRole('button', { name: 'Næste kig' }).click();
  await expect(page.getByText('Forlygter til venstre')).toBeVisible();
  await page.getByRole('button', { name: 'Næste kig' }).click();
  await expect(page.locator('.cmll-algorithm-card')).toContainText('R U R′ U′ R′ F R2');
  await expect(page.getByText('Sune + T-perm · 2 algoritmer')).toBeVisible();
  await page.getByRole('button', { name: 'Jeg er klar til CMLL' }).click();

  await page.getByRole('button', { name: 'Start uden GoCube' }).click();
  await page.getByRole('button', { name: 'Mine fire hjørner er løst' }).click();
  await expect(page.getByText('CMLL gennemført')).toBeVisible();
  await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll');
});

test('beginner LSE completes Roux with three subgoals and two M/U patterns', async ({ page }) => {
  await page.goto('/fag/roux/lse');
  await expect(page.getByRole('heading', { name: 'Last Six Edges', level: 1 })).toBeVisible();
  await expect(page.getByText('0 lange algoritmer')).toBeVisible();
  await expect(page.getByRole('tab', { name: /Delmål 1 · EO/ })).toHaveAttribute(
    'aria-selected',
    'true'
  );

  await page.getByRole('button', { name: 'Næste delmål' }).click();
  await expect(page.getByText('God kant', { exact: true })).toBeVisible();
  await expect(page.getByText('Dårlig kant', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Næste delmål' }).click();
  await expect(page.locator('.lse-pattern-card')).toContainText('M′ U M');
  await page.getByRole('button', { name: 'Næste delmål' }).click();
  await expect(page.locator('.lse-pattern-grid')).toContainText('M′ U2 M');
  await expect(page.locator('.lse-pattern-grid')).toContainText('M U2 M′');
  await page.getByRole('button', { name: 'Næste delmål' }).click();
  await expect(page.getByText('EO → L/R → 4C · 2 mønstre')).toBeVisible();
  await page.getByRole('button', { name: 'Jeg er klar til LSE' }).click();

  await page.getByRole('button', { name: 'Start uden GoCube' }).click();
  await page.getByRole('button', { name: 'Hele min cube er løst' }).click();
  await expect(page.getByText('Hele cuben er løst', { exact: true })).toBeVisible();
  await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll');
});

test('legacy GoCube setup route returns to the unified Roux workbench', async ({ page }) => {
  await page.goto('/fag/roux/opsaetning');
  await expect(page).toHaveURL(/\/fag\/roux$/);
  await expect(page.getByRole('heading', { name: 'Træn med din cube', level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tilslut' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Løs hurtigt' })).toBeDisabled();
});

test('Roux notation help distinguishes prime from the number one and explains M', async ({
  page,
}) => {
  await page.goto('/fag/roux/notation');
  await expect(page.getByRole('heading', { name: 'Sådan virker Roux' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Byg to blokke—ikke en hel side' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cubens alfabet' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'R, R′ og R2 er ikke det samme' })).toBeVisible();
  await expect(page.getByText('Er det R1?')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Back · bag' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'M er det lodrette midterlag i standardgrebet' })
  ).toBeVisible();
  await expect(page.getByText(/M-laget ligger mellem det orange L-lag.*røde R-lag/)).toBeVisible();
  await expect(page.getByText(/grøn er F foran.*blå er B bagpå.*rød er R/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'De fire faser, trin for trin' })).toBeVisible();
  await expect(page.getByText(/især M-midterskiven og U-toppen/)).toBeVisible();
  await expect(page.getByText(/kan senere udvides med hurtigere algoritmer/)).toBeVisible();
  await page.getByRole('link', { name: 'Tilbage til Roux' }).click();
  await expect(page.getByRole('heading', { name: 'Træn med din cube', level: 1 })).toBeVisible();
});

test('manual cube state entry cycles stickers and reports color-count differences', async ({
  page,
}) => {
  await page.goto('/fag/roux/manuel-tilstand');
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

test('live GoCube state opens and solves without manual input', async ({ page }) => {
  const physicalState = 'RFFLUBDBDBRDRRUUFFRDLFFFBBLUUFRDLLBRUDBULUDDLRDBLBRULF';
  await page.goto(`/fag/roux/manuel-tilstand?facelets=${physicalState}&solve=1`);

  await expect(page.getByRole('heading', { name: 'Løs den aflæste cube' })).toBeVisible();
  await expect(page.getByText('Live-tilstand modtaget')).toBeVisible();
  await expect(page.getByText(/Stillingen er fysisk mulig/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('heading', { name: 'Trin for trin tilbage til løst' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Gem og lav løsning' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Farverne passer ikke …' }).click();
  await expect(page.getByRole('heading', { name: 'Indtast én side ad gangen' })).toBeVisible();
});

test('manual cube state saves locally and produces verified color-based rescue steps', async ({
  page,
}) => {
  const physicalState = 'RFFLUBDBDBRDRRUUFFRDLFFFBBLUUFRDLLBRUDBULUDDLRDBLBRULF';
  await page.goto(`/fag/roux/manuel-tilstand?facelets=${physicalState}`);
  await page.getByRole('button', { name: 'Gem og lav løsning' }).click();
  await expect(page.getByText(/Stillingen er fysisk mulig/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('heading', { name: 'Trin for trin tilbage til løst' })).toBeVisible();
  await expect(page.getByText(/nabofarver der vender opad/)).toBeVisible();
  await expect(page.getByText('grøn side', { exact: true })).toBeVisible();
  await expect(page.getByText(/Løsningsmotorens interne kode: F2/)).toBeVisible();
  await expect(page.locator('.current-solve-step')).toContainText('Retningen er ligegyldig.');
  await page.getByRole('button', { name: 'Jeg har lavet trækket' }).click();
  await expect(page.getByText('rød side', { exact: true })).toBeVisible();
  await expect(page.getByText(/en kvart omgang mod uret/)).toBeVisible();

  await page.goto('/fag/roux/manuel-tilstand');
  await page.getByText('Vis teknisk kode til fejlsøgning').click();
  await expect(page.getByLabel('Teknisk 54-tegnskode')).toHaveValue(physicalState);
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
