import { test, expect } from '@playwright/test';

const categorias = [
  'carrera-de-insectos',
  'micromouse-amateur',
  'minisumo-amateur',
  'minisumo-profesional',
  'seguidor-de-linea-amateur',
  'seguidor-de-linea-profesional',
];

const rutasAProbar = [
  '/',
  '/registro',
  ...categorias.map((c) => `/categorias/${c}`),
];

test.describe('Copa Ollin - Smoke Tests y Casos Negativos', () => {
  test('Todas las rutas tienen etiqueta noindex estricta', async ({ page }) => {
    for (const ruta of rutasAProbar) {
      await page.goto(ruta);
      const robotsMeta = page.locator('meta[name="robots"]');
      await expect(robotsMeta).toHaveAttribute('content', 'noindex, nofollow');
    }
  });

  test('Las 6 rutas de categorías están accesibles (Status 200)', async ({
    page,
  }) => {
    for (const ruta of categorias) {
      const response = await page.goto(`/categorias/${ruta}`);
      expect(response?.status()).toBe(200);
    }
  });

  test('La landing publica imagen, detalle y PDF para las 6 categorías', async ({
    page,
  }) => {
    await page.goto('/');

    const tarjetas = page.locator('#categorias .category-card');
    await expect(tarjetas).toHaveCount(6);
    await expect(tarjetas.locator('.category-card__media img')).toHaveCount(6);

    for (const categoria of categorias) {
      await expect(
        page.locator(`#categorias a[href="/categorias/${categoria}"]`),
      ).toHaveCount(1);
      await expect(
        page.locator(`#categorias a[href="/regulations/${categoria}.pdf"]`),
      ).toHaveCount(1);
    }
  });

  test('La cuadrícula de categorías responde sin desbordamiento', async ({
    page,
  }) => {
    const viewports = [
      { width: 320, height: 800, columns: 1 },
      { width: 768, height: 900, columns: 2 },
      { width: 1280, height: 900, columns: 3 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/');

      const firstRowCount = await page
        .locator('#categorias .category-card')
        .evaluateAll((cards) => {
          const firstTop = cards[0]?.getBoundingClientRect().top;

          return cards.filter(
            (card) =>
              Math.abs(card.getBoundingClientRect().top - (firstTop ?? 0)) < 1,
          ).length;
        });

      expect(firstRowCount).toBe(viewport.columns);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
  });

  test('La ruta de registro sólo muestra el formulario ficticio de sandbox', async ({
    page,
  }) => {
    await page.goto('/registro');
    await expect(
      page.locator('astro-island:not([ssr]) form.registro-form'),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /datos ficticios únicamente/i }),
    ).toBeVisible();
    await expect(page.locator('form.registro-form')).toHaveCount(1);
    await expect(page.locator('body')).toContainText(/no envíes datos reales/i);
  });

  test('Simulación de fallo de red en recursos estáticos (Resiliencia)', async ({
    page,
  }) => {
    // Interceptar y abortar peticiones de imágenes o scripts para simular fallo
    await page.route('**/*.{png,jpg,jpeg,js,css}', (route) => route.abort());

    const response = await page.goto('/');

    // La página debe soportar la caída y cargar el HTML principal correctamente
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/Copa Ollin/i);
  });
});
