import { test, expect } from '@playwright/test';

test.describe('Shelfie Happy Path', () => {
  test('complete flow: search → pick work → pick cover → customize → export', async ({ page }) => {
    // 1. Land on intro
    await page.goto('/');
    await expect(page.getByText('shelfie')).toBeVisible();
    await expect(page.getByText('Find a Book')).toBeVisible();

    // 2. Go to search
    await page.getByText('Find a Book').click();
    await expect(page.getByPlaceholder(/title/i)).toBeVisible();

    // 3. Search for a book
    await page.getByPlaceholder(/title/i).fill('The Great Gatsby');
    await page.getByRole('button', { name: /search/i }).click();

    // 4. Wait for results and pick the first one
    await expect(page.getByText('Pick the right book')).toBeVisible({ timeout: 10000 });
    const firstResult = page.locator('button').filter({ hasText: /gatsby/i }).first();
    await expect(firstResult).toBeVisible({ timeout: 10000 });
    await firstResult.click();

    // 5. Cover selection step
    // Either we get covers or the "no covers" state
    const coverStepVisible = await page.getByText(/pick a cover|upload/i).isVisible().catch(() => false);
    if (coverStepVisible) {
      // Wait for covers to load, then pick the recommended one
      const recommendedCover = page.locator('button').filter({ hasText: /recommended/i }).first();
      const hasCover = await recommendedCover.isVisible({ timeout: 15000 }).catch(() => false);

      if (hasCover) {
        await recommendedCover.click();
      } else {
        // Pick any available cover
        const anyCover = page.locator('.cover-option').first();
        const anyVisible = await anyCover.isVisible({ timeout: 5000 }).catch(() => false);
        if (anyVisible) {
          await anyCover.click();
        }
      }
    }

    // 6. Customize step
    await expect(page.getByText(/style/i)).toBeVisible({ timeout: 10000 });

    // Switch style
    await page.getByText('Cinematic').click();

    // Set rating (tap 4th star)
    const stars = page.locator('[aria-label="4 stars"]');
    if (await stars.isVisible()) {
      await stars.click();
    }

    // 7. Create story
    await page.getByText('Create Story').click();

    // 8. Export screen
    await expect(page.getByText(/your story is ready|creating/i)).toBeVisible({ timeout: 15000 });

    // Wait for generation to complete
    const shareButton = page.getByText(/share|save image/i).first();
    await expect(shareButton).toBeVisible({ timeout: 30000 });

    // Verify post-export actions exist
    await expect(page.getByText('Edit Again')).toBeVisible();
    await expect(page.getByText('Make Another')).toBeVisible();
  });

  test('manual fallback flow works', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Find a Book').click();

    // Search for something unlikely to match
    await page.getByPlaceholder(/title/i).fill('xyznonexistentbook12345');
    await page.getByRole('button', { name: /search/i }).click();

    // Wait for "no results" state
    await expect(page.getByText(/enter manually/i)).toBeVisible({ timeout: 10000 });
    await page.getByText(/enter manually/i).click();

    // Fill in manual details
    await page.getByPlaceholder('Book title').fill('My Custom Book');
    await page.getByPlaceholder('Author').fill('Test Author');

    // Should require cover upload before continuing
    await expect(page.getByText(/upload/i)).toBeVisible();
  });
});
