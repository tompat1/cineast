import { test, expect } from '@playwright/test';

const THEMES = ['noir', 'blanco', 'mono'];

const HOMEPAGE_CRITICAL_SELECTORS = [
  { name: 'nav logo', selector: '.brand-logo' },
  { name: 'hero title', selector: '.hero-title' },
  { name: 'hero subtitle', selector: '.hero-subtitle' },
  { name: 'intro title', selector: '#intro .serif-title' },
  { name: 'intro mono copy', selector: '#intro .mono-caps' },
  { name: 'intro meta', selector: '#intro .small-meta' },
  { name: 'intro statement number', selector: '#intro .corner-brackets .number' },
  { name: 'road notes title', selector: '.road-intro-title' },
  { name: 'now showing title', selector: '.now-showing-title' },
  { name: 'now showing card title', selector: '.now-showing-card h3' },
  { name: 'scene studies heading', selector: '.scene-studies-title' },
  { name: 'scene studies feature title', selector: '.scene-featured-title' },
  { name: 'shop title', selector: '.shop-title' },
  { name: 'shop product title', selector: '.product-card .product-title' },
  { name: 'shop buy button', selector: '.product-card .buy-btn' },
  { name: 'shop info title', selector: '.shop-info-grid .info-title' },
  { name: 'about headline', selector: '.about-headline' },
  { name: 'journal card title', selector: '.journal-card .entry-title' }
];

const MONO_STRICT_SELECTORS = [
  '.brand-logo',
  '.hero-title',
  '.hero-subtitle',
  '#intro .serif-title',
  '#intro .mono-caps',
  '#intro .small-meta',
  '.road-intro-title',
  '.road-intro-copy',
  '.now-showing-title',
  '.now-showing-copy',
  '.now-showing-card h3',
  '.now-card-body p',
  '.scene-studies-title',
  '.scene-featured-title',
  '.scene-featured-copy',
  '.shop-title',
  '.shop-desc',
  '.product-card .product-title',
  '.product-card .product-price',
  '.product-card .buy-btn',
  '.shop-info-grid .info-title',
  '.shop-info-grid .info-desc',
  '.about-headline',
  '.about-description',
  '.about-description-italic',
  '.journal-card .entry-title'
];

async function setTheme(page, theme) {
  await page.evaluate((nextTheme) => {
    localStorage.setItem('theme', nextTheme);
  }, theme);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        transition: none !important;
        animation: none !important;
      }
    `
  });
}

async function waitForHomepageContent(page) {
  await page.waitForSelector('.now-showing-card h3', { timeout: 5000 });
  await page.waitForSelector('.scene-featured-title', { timeout: 5000 });
}

async function assertReadableElement(page, selector, name) {
  const locator = page.locator(selector).first();
  await expect(locator, `${name} should exist`).toHaveCount(1);
  await expect(locator, `${name} should be visible`).toBeVisible();

  const result = await locator.evaluate((element) => {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      text: element.textContent.trim(),
      width: rect.width,
      height: rect.height,
      opacity: Number(style.opacity),
      visibility: style.visibility,
      display: style.display,
      color: style.color,
      fontSize: parseFloat(style.fontSize)
    };
  });

  expect(result.text.length, `${name} should contain text`).toBeGreaterThan(0);
  expect(result.width, `${name} should have width`).toBeGreaterThan(4);
  expect(result.height, `${name} should have height`).toBeGreaterThan(4);
  expect(result.opacity, `${name} should not be faded out`).toBeGreaterThanOrEqual(0.72);
  expect(result.visibility, `${name} should not be hidden`).toBe('visible');
  expect(result.display, `${name} should not be display:none`).not.toBe('none');
  expect(result.fontSize, `${name} should have a real font size`).toBeGreaterThanOrEqual(9);
  expect(parseColor(result.color).a, `${name} text color should not be washed out`).toBeGreaterThanOrEqual(0.7);
}

async function assertMonoContrast(page, selector) {
  const locator = page.locator(selector).first();
  await expect(locator, `${selector} should be visible in mono`).toBeVisible();

  const result = await locator.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      text: element.textContent.trim(),
      color: style.color,
      opacity: Number(style.opacity)
    };
  });

  expect(result.text.length, `${selector} should contain text`).toBeGreaterThan(0);
  expect(result.opacity, `${selector} should be fully readable in mono`).toBeGreaterThanOrEqual(0.9);

  const textColor = parseColor(result.color);
  const contrast = contrastRatio(textColor, { r: 255, g: 255, b: 255, a: 1 });
  expect(contrast, `${selector} should contrast against the mono white surface`).toBeGreaterThanOrEqual(7);
}

function parseColor(color) {
  const match = String(color).match(/rgba?\(([^)]+)\)/);
  if (!match) return { r: 0, g: 0, b: 0, a: 1 };
  const parts = match[1].split(',').map((part) => part.trim());
  return {
    r: Number(parts[0]),
    g: Number(parts[1]),
    b: Number(parts[2]),
    a: parts[3] === undefined ? 1 : Number(parts[3])
  };
}

function luminance({ r, g, b }) {
  const channels = [r, g, b].map((value) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(foreground, background) {
  const fg = luminance(foreground);
  const bg = luminance(background);
  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);
  return (lighter + 0.05) / (darker + 0.05);
}

test.describe('Critical Theme Sections', () => {
  for (const theme of THEMES) {
    test(`Homepage critical sections stay visible - ${theme}`, async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await setTheme(page, theme);
      await waitForHomepageContent(page);

      for (const item of HOMEPAGE_CRITICAL_SELECTORS) {
        await assertReadableElement(page, item.selector, `${theme} ${item.name}`);
      }
    });
  }

  test('Mono homepage critical text keeps strong contrast', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await setTheme(page, 'mono');
    await waitForHomepageContent(page);

    for (const selector of MONO_STRICT_SELECTORS) {
      await assertMonoContrast(page, selector);
    }
  });

  test('Now Showing notes drawer remains readable in every theme', async ({ page }) => {
    for (const theme of THEMES) {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await setTheme(page, theme);
      await waitForHomepageContent(page);
      await page.locator('[data-now-showing-notes-open]').click();
      await expect(page.locator('#now-showing-notes-drawer')).toHaveClass(/open/);

      await assertReadableElement(page, '.now-notes-title', `${theme} notes drawer title`);
      await assertReadableElement(page, '.now-notes-filter', `${theme} notes drawer filter`);
      await assertReadableElement(page, '.now-notes-card h3', `${theme} notes drawer card title`);
      await page.locator('#now-showing-notes-close').click();
    }
  });

  test('Phone visitors always render mono and hide the top-nav theme control', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    for (const path of ['/', '/article.html']) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => localStorage.setItem('theme', 'blanco'));
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'mono');
    }

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#theme-dropdown')).toBeHidden();
  });

  test('Phone mono shop and archive controls stay inside the viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/#shop', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.setItem('theme', 'blanco'));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'mono');
    await expect(page.locator('.product-card').first()).toBeVisible();

    const shopLayout = await page.evaluate(() => {
      const viewportWidth = window.innerWidth;
      const productCards = Array.from(document.querySelectorAll('.product-grid .product-card')).slice(0, 3);
      return {
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth,
        productWidths: productCards.map((card) => card.getBoundingClientRect().width),
        productRights: productCards.map((card) => card.getBoundingClientRect().right)
      };
    });

    expect(shopLayout.scrollWidth, 'phone shop should not create page-level horizontal overflow').toBeLessThanOrEqual(shopLayout.viewportWidth + 2);
    for (const width of shopLayout.productWidths) {
      expect(width, 'phone mono product cards should be one readable column').toBeGreaterThan(shopLayout.viewportWidth * 0.82);
      expect(width, 'phone mono product cards should fit inside the viewport').toBeLessThanOrEqual(shopLayout.viewportWidth);
    }
    for (const right of shopLayout.productRights) {
      expect(right, 'phone mono product card should not extend past viewport').toBeLessThanOrEqual(shopLayout.viewportWidth + 1);
    }

    await page.goto('/#global-search-panel', { waitUntil: 'domcontentloaded' });
    await page.locator('#open-global-search-mobile').click();
    await expect(page.locator('#global-search-panel')).toHaveClass(/open/);
    await assertMonoContrast(page, '.global-search-panel .archive-filter-chip');
    await assertMonoContrast(page, '.global-search-panel .tag-btn');
    await assertMonoContrast(page, '.global-search-panel .global-search-empty');
  });

  test('Archive search matches spaced and unspaced actor names', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('.search-btn').click();
    await expect(page.locator('#global-search-panel')).toHaveClass(/open/);

    await page.locator('#global-search-input').fill('Robert Deniro');
    await expect(page.locator('#global-results-count')).toContainText(/MATCHING SCENE/);
    await expect(page.locator('#global-search-results-grid .short-card').first()).toBeVisible();

    const resultText = await page.locator('#global-search-results-grid').innerText();
    expect(resultText.toLowerCase()).toMatch(/deniro|de niro|midnight run/);
  });

  test('Shorts feed follows blanco and mono theme surfaces', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    for (const theme of ['blanco', 'mono']) {
      await setTheme(page, theme);
      await expect(page.locator('#shorts .short-card').first()).toBeVisible();

      const surface = await page.locator('#shorts').evaluate((element) => {
        const style = window.getComputedStyle(element);
        return {
          backgroundColor: style.backgroundColor,
          color: style.color
        };
      });
      const cardSurface = await page.locator('#shorts .short-card').first().evaluate((element) => {
        const style = window.getComputedStyle(element);
        return {
          backgroundColor: style.backgroundColor,
          borderColor: style.borderColor
        };
      });

      expect(luminance(parseColor(surface.backgroundColor)), `${theme} shorts section should not use noir black`).toBeGreaterThan(0.72);
      expect(luminance(parseColor(cardSurface.backgroundColor)), `${theme} shorts card should not use noir black`).toBeGreaterThan(0.72);
      await assertReadableElement(page, '#shorts .section-label', `${theme} shorts label`);
      await assertReadableElement(page, '#shorts .section-meta', `${theme} shorts meta`);
      await assertReadableElement(page, '#shorts .short-title', `${theme} shorts card title`);
      await assertReadableElement(page, '#shorts .short-excerpt', `${theme} shorts card excerpt`);
    }
  });

  test('Tablet visitors keep theme choice and theme control', async ({ page }) => {
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.setItem('theme', 'blanco'));
    await page.reload({ waitUntil: 'domcontentloaded' });

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'blanco');
    await expect(page.locator('#theme-dropdown')).toBeVisible();
  });
});
