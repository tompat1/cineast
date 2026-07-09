import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Helper to switch theme via localStorage and reload
async function setTheme(page, theme) {
  await page.evaluate((t) => {
    localStorage.setItem('theme', t);
  }, theme);
  await page.reload();
  await page.waitForLoadState('networkidle');
  // Force static rendering (disable animations, transitions, and initial opacity:0 reveal states)
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        transition: none !important;
        animation: none !important;
        opacity: 1 !important;
        filter: none !important;
      }
    `
  });
}

test.describe('Theme Color Contrast Verification', () => {
  test('Homepage Contrast - Noir theme', async ({ page }) => {
    await page.goto('/');
    await setTheme(page, 'noir');
    
    // Wait for Now Showing cards to render
    await page.waitForSelector('.now-showing-card', { timeout: 5000 });
    
    // Run Axe color-contrast check excluding the design-approved low-contrast footer and shorts section
    const results = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .exclude('footer')
      .exclude('#shorts')
      .analyze();
      
    expect(results.violations).toEqual([]);
  });

  test('Homepage Contrast - Blanco theme', async ({ page }) => {
    await page.goto('/');
    await setTheme(page, 'blanco');
    
    await page.waitForSelector('.now-showing-card', { timeout: 5000 });
    
    const results = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .exclude('footer')
      .exclude('#shorts')
      .analyze();
      
    expect(results.violations).toEqual([]);
  });

  test('Article Page Contrast - Noir theme', async ({ page }) => {
    await page.goto('/article.html');
    await setTheme(page, 'noir');
    
    const results = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .exclude('footer')
      .analyze();
      
    expect(results.violations).toEqual([]);
  });

  test('Article Page Contrast - Blanco theme', async ({ page }) => {
    await page.goto('/article.html');
    await setTheme(page, 'blanco');
    
    const results = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .exclude('footer')
      .analyze();
      
    expect(results.violations).toEqual([]);
  });

  test('Homepage Contrast - Mono theme', async ({ page }) => {
    await page.goto('/');
    await setTheme(page, 'mono');
    
    await page.waitForSelector('.now-showing-card', { timeout: 5000 });
    
    const results = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .exclude('footer')
      .exclude('#shorts')
      .analyze();
      
    expect(results.violations).toEqual([]);
  });

  test('Article Page Contrast - Mono theme', async ({ page }) => {
    await page.goto('/article.html');
    await setTheme(page, 'mono');
    
    const results = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .exclude('footer')
      .analyze();
      
    expect(results.violations).toEqual([]);
  });
});
