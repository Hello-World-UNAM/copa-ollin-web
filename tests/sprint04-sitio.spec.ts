import { expect, test } from '@playwright/test';

test.describe('Sprint 4 - Sitio informativo accesible', () => {
  test('la portada publica metadatos Open Graph básicos', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
      'content',
      'website',
    );

    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute(
      'content',
      'es_MX',
    );

    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);

    await expect(page.locator('meta[property="og:description"]')).toHaveCount(
      1,
    );
  });

  test('robots.txt bloquea el rastreo del sitio', async ({ request }) => {
    const response = await request.get('/robots.txt');

    expect(response.ok()).toBeTruthy();

    const body = await response.text();

    expect(body).toContain('User-agent: *');
    expect(body).toContain('Disallow: /');
  });

  test('el breadcrumb muestra Categorías como enlace', async ({ page }) => {
    await page.goto('/categorias/minisumo-amateur');

    const breadcrumb = page.getByRole('navigation', {
      name: 'Ruta de navegación',
    });

    await expect(
      breadcrumb.getByRole('link', { name: 'Categorías' }),
    ).toHaveAttribute('href', '/#categorias');

    await expect(breadcrumb.locator('[aria-current="page"]')).toContainText(
      /Minisumo/i,
    );
  });

  test('los reglamentos usan acordeones funcionales', async ({ page }) => {
    await page.goto('/categorias/minisumo-amateur');

    const accordions = page.locator('details.regulation-section');

    expect(await accordions.count()).toBeGreaterThan(0);

    const firstAccordion = accordions.first();
    const summary = firstAccordion.locator('summary');

    await expect(summary).toBeVisible();
    await expect(firstAccordion).not.toHaveAttribute('open', '');

    await summary.click();

    await expect(firstAccordion).toHaveAttribute('open', '');
  });

  test('los enlaces externos del footer abren en una pestaña nueva', async ({
    page,
  }) => {
    await page.goto('/');

    const externalLinks = [
      page.getByRole('link', { name: /Instagram de CROFI/i }),
      page.getByRole('link', { name: /Facebook de CROFI/i }),
      page.getByRole('link', { name: /Hello World/i }),
      page.getByRole('link', {
        name: /Facultad de Ingeniería, UNAM/i,
      }),
    ];

    for (const link of externalLinks) {
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', /noopener noreferrer/);
    }
  });
});
