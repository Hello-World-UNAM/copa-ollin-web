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

  test('La ruta de registro no muestra formularios activos ni inputs', async ({
    page,
  }) => {
    await page.goto('/registro');

    // Verificar que no hay campos de entrada que puedan recolectar datos
    await expect(page.locator('form')).toHaveCount(0);
    await expect(page.locator('input')).toHaveCount(0);

    // Verificar el mensaje de estado
    await expect(page.locator('body')).toContainText(/en preparación/i);
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
