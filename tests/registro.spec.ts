import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { fixtureRegistro, tokenSandboxE2e } from './fixtures/registro';

test.describe('Registro de equipo en sandbox local', () => {
  test('completa el formulario ficticio y recibe respuesta del endpoint real local', async ({
    page,
  }) => {
    await page.route('**/api/register', (route) =>
      route.continue({
        headers: {
          ...route.request().headers(),
          authorization: `Bearer ${tokenSandboxE2e}`,
        },
      }),
    );

    await page.goto('/registro');
    await expect(
      page.locator('astro-island:not([ssr]) form.registro-form'),
    ).toBeVisible();

    await page
      .getByLabel(/Nombre del equipo/i)
      .fill(fixtureRegistro.equipo.nombre);
    await page
      .getByLabel(/Institución educativa/i)
      .fill(fixtureRegistro.equipo.institucion);
    await page
      .getByLabel(/Estado o ciudad de procedencia/i)
      .fill(fixtureRegistro.equipo.procedencia);
    await page.getByRole('button', { name: 'Continuar' }).click();

    await page
      .getByLabel(/Nombre completo del capitán/i)
      .fill(fixtureRegistro.capitan.nombre);
    await page
      .getByLabel('Correo electrónico', { exact: true })
      .fill(fixtureRegistro.capitan.correo);
    await page.getByLabel(/Teléfono/i).fill(fixtureRegistro.capitan.telefono);
    await page
      .getByLabel(/Integrante 1: nombre completo/i)
      .fill('Integrante Ficticio Inicial');
    await page
      .getByLabel(/Correo electrónico \(Opcional\)/i)
      .first()
      .fill('integrante-inicial@example.invalid');

    await page.getByRole('button', { name: /Agregar integrante/i }).click();
    await page
      .getByLabel(/Integrante 2: nombre completo/i)
      .fill(fixtureRegistro.integranteExtra.nombre);
    await page
      .getByLabel(/Correo electrónico \(Opcional\)/i)
      .last()
      .fill(fixtureRegistro.integranteExtra.correo);
    await page.getByRole('button', { name: 'Continuar' }).click();

    await page.getByRole('button', { name: 'Volver' }).click();
    await expect(page.getByLabel(/Integrante 2: nombre completo/i)).toHaveValue(
      fixtureRegistro.integranteExtra.nombre,
    );
    await page.getByRole('button', { name: 'Continuar' }).click();

    await page
      .getByLabel(/Nombre del robot/i)
      .fill(fixtureRegistro.robot.nombre);
    await page
      .getByLabel(/Descripción del robot/i)
      .fill(fixtureRegistro.robot.descripcion);
    await page.getByRole('button', { name: 'Continuar' }).click();

    const fakePdf = Buffer.from('%PDF-1.4 contenido ficticio de prueba');

    await page.getByLabel(/Identificación del capitán/i).setInputFiles({
      name: 'identificacion-ficticia.pdf',
      mimeType: 'application/pdf',
      buffer: fakePdf,
    });
    await page.getByLabel(/Comprobante de pago/i).setInputFiles({
      name: 'comprobante-ficticio.pdf',
      mimeType: 'application/pdf',
      buffer: fakePdf,
    });
    await page.getByLabel(/Carta responsiva/i).setInputFiles({
      name: 'carta-ficticia.pdf',
      mimeType: 'application/pdf',
      buffer: fakePdf,
    });

    await page.getByLabel(/Acepto el reglamento/i).check();
    await page.getByLabel(/Acepto el uso de fotografías/i).check();
    await page.getByLabel(/Confirmo que el robot cumple/i).check();
    await page.getByRole('button', { name: 'Continuar' }).click();

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/register') &&
        response.request().method() === 'POST',
    );

    await page
      .getByRole('button', { name: 'Enviar registro de prueba' })
      .click();

    const response = await responsePromise;
    expect(response.status()).toBe(200);
    await expect(page.getByRole('status')).toContainText(
      /no representa una inscripción aceptada/i,
    );
  });

  test('Auditoría de accesibilidad y línea base de rendimiento', async ({
    page,
  }) => {
    // 1. Línea base de rendimiento: medir el tiempo de carga
    const startTime = Date.now();
    await page.goto('/registro');
    const loadTime = Date.now() - startTime;

    // Umbral informativo: el formulario debe cargar en menos de 3 segundos (3000ms)
    expect(loadTime).toBeLessThan(3000);

    // 2. Auditoría automatizada básica con Axe
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    // Esperamos que no haya violaciones de accesibilidad graves (arreglo vacío)
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
