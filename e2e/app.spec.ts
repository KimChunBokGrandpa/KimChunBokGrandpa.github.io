import { expect, test } from 'playwright/test';

function createShareCode(payload: unknown): string {
  return Buffer.from(JSON.stringify(payload), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('retro-pixel-locale', 'en');
    localStorage.setItem('retropixel_onboarding_dismissed', '1');
  });
});

test('core user flow: sample image, adjust palette, compare, and save', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('try-sample-button').click();

  const previewImage = page.getByTestId('processed-preview-image');
  await expect(previewImage).toBeVisible();

  await page.getByTestId('quick-palette-nes').click();
  await expect(previewImage).toBeVisible();

  await page.getByTestId('toggle-compare-button').click();
  await expect(page.getByTestId('cycle-compare-variant-button')).toBeVisible();

  await page.getByTestId('toggle-compare-button').click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByTestId('save-image-button').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^retro_pixel_.*\.(png|jpg|webp)$/);
});

test('shared preset url auto-applies and clears query param', async ({ page }) => {
  const code = createShareCode({
    kind: 'retro-pixel-preset',
    version: 1,
    name: 'Shared URL Preset',
    settings: {
      pixelSize: 7,
      palette: 'cga',
      crtEffect: 'none',
      glitchFilters: [],
      renderMode: 'pixel_perfect',
      glitchSeed: null,
      ditherType: 'ordered',
      effectLayers: [],
      useOklab: false,
    },
  });

  await page.goto(`/?preset=${code}`);

  await expect(page.getByText('Shared preset applied.')).toBeVisible();
  await expect(page).toHaveURL(/\/$/);

  await page.getByRole('tab', { name: 'Presets' }).click();
  await expect(page.getByTestId('shared-presets')).toBeVisible();
  await expect(page.getByText('🔗 Shared URL Preset')).toBeVisible();
});

test('cloud preset publish shows published and community sections', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('try-sample-button').click();
  await page.getByRole('tab', { name: 'Presets' }).click();
  await page.getByTestId('preset-cloud-open-publish').click();
  await page.getByTestId('preset-cloud-name-input').fill('Feed Test Preset');
  await page.getByTestId('preset-cloud-publish-public').click();

  await expect(page.getByText('Cloud preset published to the public feed.')).toBeVisible();
  await expect(page.getByTestId('published-cloud-presets')).toBeVisible();
  await expect(page.getByTestId('community-presets')).toBeVisible();
  await expect(page.getByTestId('published-cloud-presets').getByRole('button', { name: /Feed Test Preset/ })).toBeVisible();
  await expect(page.getByTestId('community-presets').getByRole('button', { name: /Feed Test Preset/ })).toBeVisible();
});

test.describe('mobile layout', () => {
  test.use({
    viewport: { width: 540, height: 320 },
    isMobile: true,
    hasTouch: true,
  });

  test('applies split layout for settings and preview in landscape mobile', async ({ page }) => {
    await page.goto('/');

    const dialogs = page.locator('[role="dialog"]');
    await expect(dialogs).toHaveCount(2);

    const settingsWindow = page.locator('[role="dialog"][aria-label*="Settings"]').first();
    const previewWindow = page.locator('[role="dialog"][aria-label*="Preview"]').first();

    await expect(settingsWindow).toBeVisible();
    await expect(previewWindow).toBeVisible();
    await expect(settingsWindow).toHaveAttribute('style', /--mobile-w:\s*38vw/);
    await expect(previewWindow).toHaveAttribute('style', /--mobile-l:\s*38vw/);
    await expect(previewWindow).toHaveAttribute('style', /--mobile-w:\s*62vw/);
  });
});
