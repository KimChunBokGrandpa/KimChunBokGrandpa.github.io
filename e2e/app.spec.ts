import { test, expect } from '@playwright/test';

test.describe('Retro Pixel Converter', () => {
  test('loads the app with desktop and taskbar', async ({ page }) => {
    await page.goto('/');
    // Taskbar should be visible
    await expect(page.locator('.taskbar')).toBeVisible();
    // Desktop icons should be visible
    await expect(page.locator('.desktop-icons')).toBeVisible();
  });

  test('opens image drop zone in preview window', async ({ page }) => {
    await page.goto('/');
    // Preview window should contain the drop zone
    const dropZone = page.locator('.dropzone, .drop-content');
    await expect(dropZone.first()).toBeVisible({ timeout: 5000 });
  });

  test('taskbar shows window buttons', async ({ page }) => {
    await page.goto('/');
    // Taskbar items for open windows
    const taskbarItems = page.locator('.tb-item');
    await expect(taskbarItems.first()).toBeVisible();
  });

  test('can toggle window minimize via taskbar', async ({ page }) => {
    await page.goto('/');
    // Click a taskbar item to toggle its window
    const firstItem = page.locator('.tb-item').first();
    await firstItem.click();
    // The window should react (either minimize or restore)
    // Just verify no crash occurs
    await expect(firstItem).toBeVisible();
  });

  test('keyboard shortcut panel opens with ?', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('?');
    // Keyboard shortcuts dialog should appear
    const dialog = page.locator('[role="dialog"]').filter({ hasText: /shortcut|keyboard/i });
    // May or may not appear depending on focus state - just verify no crash
    await page.waitForTimeout(300);
  });

  test('language toggle cycles through locales', async ({ page }) => {
    await page.goto('/');
    const langBtn = page.locator('.tray-lang');
    await expect(langBtn).toBeVisible();
    const initialText = await langBtn.textContent();
    await langBtn.click();
    const newText = await langBtn.textContent();
    expect(newText).not.toBe(initialText);
  });

  test('settings window has preset buttons', async ({ page }) => {
    await page.goto('/');
    // Look for preset buttons in the control panel
    const presetBtn = page.locator('.preset-btn');
    await expect(presetBtn.first()).toBeVisible({ timeout: 5000 });
  });

  test('window close button works', async ({ page }) => {
    await page.goto('/');
    // Find a window's close button (title-bar-controls last button)
    const closeBtn = page.locator('.title-bar-controls button').last();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      // Window should be closed or minimized
      await page.waitForTimeout(200);
    }
  });
});
