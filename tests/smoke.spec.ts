import { test, expect } from '@playwright/test';

test.describe('Copa Ollin - Smoke Tests', () => {
  // Configuración global de la suite
  test.use({ baseURL: 'http://localhost:4321' });

  test('La landing page carga y tiene etiqueta noindex', async ({ page }) => {
    await page.goto('/');

    // Validar título y carga
    await expect(page).toHaveTitle(/Copa Ollin/i);

    // Validar comportamiento noindex estricto
    const robotsMeta = page.locator('meta[name="robots"]');
    await expect(robotsMeta).toHaveAttribute('content', 'noindex, nofollow');
  });

  test('Las 6 rutas de categorías están accesibles', async ({ page }) => {
    const categorias = [
      'carrera-de-insectos',
      'micromouse-amateur',
      'minisumo-amateur',
      'minisumo-profesional',
      'seguidor-de-linea-amateur',
      'seguidor-de-linea-profesional',
    ];

    for (const ruta of categorias) {
      const response = await page.goto(`/categorias/${ruta}`);
      expect(response?.status()).toBe(200);
    }
  });

  test('La ruta de registro mockea servicios externos y muestra "en preparación"', async ({
    page,
  }) => {
    // Interceptar llamadas de red (Criterio: Las fronteras se mockean)
    await page.route('**/*', async (route) => {
      const request = route.request();
      if (
        request.url().includes('google.com') ||
        request.url().includes('vercel.app')
      ) {
        await route.fulfill({
          status: 403,
          body: JSON.stringify({
            error: 'Acceso bloqueado en entorno de pruebas',
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/registro');

    // Verificar que el registro no está activo
    await expect(page.locator('body')).toContainText(/en preparación/i);
  });
});
