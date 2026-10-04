import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('header y footer sin desbordes, menú accesible y controles táctiles', async ({
  page,
}) => {
  for (const width of [320, 375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const header = page.locator('.site-header');
    const toggle = page.getByRole('button', { name: 'Abrir menú' });
    const nav = page.getByRole('navigation', { name: 'Navegación principal' });
    if (width < 1024) {
      await expect(toggle).toBeVisible();
      await expect(nav).toBeHidden();
      const brandBox = await header
        .locator('.site-header__brand')
        .boundingBox();
      const toggleBox = await toggle.boundingBox();
      expect(brandBox).not.toBeNull();
      expect(toggleBox).not.toBeNull();
      expect(toggleBox!.x).toBeGreaterThan(brandBox!.x + brandBox!.width);
      expect(toggleBox!.width).toBeGreaterThanOrEqual(44);
      expect(toggleBox!.height).toBeGreaterThanOrEqual(44);
      await toggle.click();
      await expect(nav).toBeVisible();
      await expect(
        nav.getByRole('link', { name: 'Inicio', exact: true }),
      ).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(nav).toBeHidden();
      await expect(toggle).toBeFocused();
    } else {
      await expect(toggle).toBeHidden();
      await expect(nav).toBeVisible();
    }
    for (const link of await page.locator('.site-footer a').all()) {
      expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const audit = await new AxeBuilder({ page })
      .include('.site-header')
      .include('.site-footer')
      .analyze();
    expect(audit.violations).toEqual([]);
  }
});

test('navegación se adapta al cambiar de ancho y cierra al elegir una sección', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await page.getByRole('button', { name: 'Abrir menú' }).click();
  await nav.getByRole('link', { name: 'Categorías', exact: true }).click();
  await expect(nav).toBeHidden();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(nav).toBeVisible();
  await page.setViewportSize({ width: 375, height: 900 });
  await expect(nav).toBeHidden();
  await expect(
    page.getByRole('button', { name: 'Abrir menú' }),
  ).toHaveAttribute('aria-expanded', 'false');
});

test('sin JavaScript los enlaces de navegación siguen disponibles', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 320, height: 900 },
  });
  try {
    const page = await context.newPage();
    await page.goto(baseURL!);
    const nav = page.getByRole('navigation', { name: 'Navegación principal' });
    await expect(nav).toBeVisible();
    await expect(
      nav.getByRole('link', { name: 'Registro', exact: true }),
    ).toBeVisible();
    await expect(page.locator('.site-nav__toggle')).toBeHidden();
  } finally {
    await context.close();
  }
});
