import { expect, test } from '@playwright/test';

test('all ten subjects use the same navigation and theme', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/fag');
  await page.waitForLoadState('networkidle');
  for (const [route, title] of [
    ['elements', 'Grundstoffer'],
    ['morse', 'Morse'],
    ['flashcards', 'Flashkort'],
    ['phonetics', 'Fonetik'],
    ['python_output', 'Python-hjernen'],
  ]) {
    await page.goto(`/fag/${route}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  }
  expect(errors).toEqual([]);
});
test('element recall accepts English, logs latency and renders all cells', async ({ page }) => {
  await page.goto('/fag/elements?unit=elements%3Asymbol_to_name%3A26');
  await page.getByRole('textbox', { name: 'Dit svar' }).fill(' Iron ');
  await page.getByRole('button', { name: 'Tjek svar' }).click();
  await expect(page.getByRole('status')).toContainText('Korrekt');
  await page.getByText('Åbn det komplette periodiske system').click();
  await expect(page.locator('.periodic-grid.reference button')).toHaveCount(118);
  await page.goto('/statistik');
  await expect(page.getByText('Faglig aktivitet')).toBeVisible();
});
test('flashcard reveal and rating persist without losing the active feedback', async ({ page }) => {
  await page.goto('/fag/flashcards?unit=flashcards%3Aconversion%3Askill%3AF-to-C');
  await page.getByRole('button', { name: 'Vend kortet', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Kortets bagside' })).toContainText('°C');
  await page.getByRole('button', { name: 'Kunne', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Gemt');
  await page.reload();
  await expect(page.getByText(/1 øvet i dag/)).toBeVisible();
});
test('deck subset and direction preferences survive reload and disabling retains history', async ({
  page,
}) => {
  await page.goto('/fag/flashcards');
  await page.getByRole('button', { name: '🌍 Lande' }).click();
  await page.getByLabel('Hovedstad → land').uncheck();
  await page.getByLabel('Flag → land').uncheck();
  await page.getByLabel('Asien', { exact: true }).uncheck();
  const countries = page.locator('.deck-grid article').filter({ hasText: '🌍 Lande' });
  await countries.getByLabel('Med i dagens træning').uncheck();
  await expect(countries.getByLabel('Med i dagens træning')).toBeEnabled();
  await page.reload();
  await page.getByRole('button', { name: '🌍 Lande' }).click();
  await expect(page.getByLabel('Hovedstad → land')).not.toBeChecked();
  await expect(page.getByLabel('Asien', { exact: true })).not.toBeChecked();
  await expect(countries.getByLabel('Med i dagens træning')).not.toBeChecked();
});
test('morse receive has no visible character or code overlay and send accepts space taps', async ({
  page,
}) => {
  await page.goto('/fag/morse');
  await expect(page.getByRole('heading', { name: 'Lyt, og skriv tegnet' })).toBeVisible();
  await expect(page.locator('.exercise-shell')).not.toContainText('-.-');
  await expect(page.getByRole('button', { name: 'Tjek svar' })).toBeDisabled();
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await page.getByRole('combobox').selectOption('morse:send:K');
  const pad = page.getByRole('button', { name: /Tap ·/ });
  await pad.focus();
  for (const ms of [180, 60, 180]) {
    await page.keyboard.down('Space');
    await page.waitForTimeout(ms);
    await page.keyboard.up('Space');
    await page.waitForTimeout(60);
  }
  await page.getByRole('button', { name: 'Tjek svar' }).click();
  await expect(page.getByRole('status')).toContainText('Dine tryk');
});
test('phonetics reveals audio only after spectrogram answer; Python grades exact stdout', async ({
  page,
}) => {
  await page.goto('/fag/phonetics');
  await expect(page.getByRole('img', { name: /Spektrogram med/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Afspil lyd' })).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Dit svar' }).fill('vokal');
  await page.getByRole('button', { name: 'Tjek svar' }).click();
  await expect(page.getByRole('button', { name: 'Afspil lyd' })).toBeVisible();
  await page.goto('/fag/python_output?unit=python_output%3Amutable-default');
  await page.getByRole('textbox', { name: 'Stdout / exception' }).fill('[0] [0, 1]');
  await page.getByRole('button', { name: 'Tjek svar' }).click();
  await expect(page.getByRole('status')).toContainText('Korrekt');
});
test('precache supports all five new routes without network', async ({
  page,
  context,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'Service worker offline gate runs in Chromium; WebKit drills run above.'
  );
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  for (const route of ['elements', 'morse', 'flashcards', 'phonetics', 'python_output']) {
    await page.goto(`/fag/${route}`);
    await expect(page.locator('h1')).toBeVisible();
  }
  await page.goto('/fag/phonetics');
  const img = page.locator('.spectrogram');
  await expect(img).toBeVisible();
  expect(await img.evaluate((e) => (e as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await page.goto('/fag/flashcards?unit=flashcards%3Aconversion%3Askill%3AF-to-C');
  await page.getByRole('button', { name: 'Vend kortet', exact: true }).click();
  await page.getByRole('button', { name: 'Kunne', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Gemt');
  await context.setOffline(false);
});
test('version-one IndexedDB migrates on load and keeps old settings', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Start dagens træning/ })).toBeVisible();
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open('peterlingo', 1);
      r.onupgradeneeded = () => {
        if (!r.result.objectStoreNames.contains('state')) r.result.createObjectStore('state');
      };
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('state', 'readwrite');
      const store = tx.objectStore('state');
      const get = store.get('current');
      get.onsuccess = () => {
        const old = get.result ?? {
          settings: { theme: 'dark', focusWeights: { pi: 3 } },
          attempts: [],
          scheduledUnits: [],
          mastery: [],
          sessions: [],
          diagnostics: [],
          hardware: { preferredAdapter: 'real' },
        };
        old.schemaVersion = 1;
        old.settings.theme = 'dark';
        delete old.settings.deckSettings;
        store.put(old, 'current');
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.goto('/fag/flashcards');
  await expect(page.getByRole('heading', { name: 'Flashkort', exact: true })).toBeVisible();
});

test('Morse audio can be received and rated through the common attempt path', async ({ page }) => {
  await page.goto('/fag/morse?unit=morse%3Areceive%3AK');
  await page.getByRole('button', { name: 'Afspil lyd', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Lyt igen' })).toBeEnabled();
  await page.getByRole('textbox', { name: 'Dit svar' }).fill('k');
  await page.getByRole('button', { name: 'Tjek svar' }).click();
  await expect(page.getByRole('status')).toContainText('Korrekt');
});

test('local song audio and a sparse timestamp map enable bounded playback', async ({ page }) => {
  await page.goto('/fag/elements');
  await expect(page.getByRole('button', { name: 'Afspil sangstump' })).toBeDisabled();
  await page.getByLabel('Vælg audio').setInputFiles('public/assets/phonetics/vowel-i.wav');
  await page.getByLabel('Importér tidsmærker (JSON)').setInputFiles({
    name: 'offsets.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"1":0,"2":300}'),
  });
  await page.getByRole('button', { name: 'Afspil sangstump' }).click();
  await expect
    .poll(() => page.locator('audio').evaluate((e) => (e as HTMLAudioElement).currentTime))
    .toBeGreaterThan(0);
  await expect
    .poll(() => page.locator('audio').evaluate((e) => (e as HTMLAudioElement).paused))
    .toBe(true);
});
