import { test, expect } from '@playwright/test';
import { fixtureRegistro } from './fixtures/registro';
import AxeBuilder from '@axe-core/playwright';

test.describe('Registro de Equipo - Integración Real Sandbox', () => {
  test('Completa el formulario, conserva datos al retroceder, sube PDFs y usa la ruta real', async ({
    page,
  }) => {
    // 1. SE ELIMINÓ EL MOCK DE CLIENTE.
    // Ahora Playwright hará la petición POST real al endpoint /api/register del servidor.

    await page.goto('/registro');

    // Paso 1: Información del Equipo
    await page
      .getByLabel(/Nombre del equipo/i)
      .fill(fixtureRegistro.equipo.nombre);
    await page
      .getByLabel(/Institución/i)
      .fill(fixtureRegistro.equipo.institucion);
    await page.getByRole('button', { name: /Siguiente/i }).click();

    // Paso 2: Integrantes
    await page
      .getByLabel(/Nombre del capitán/i)
      .fill(fixtureRegistro.capitan.nombre);
    await page
      .getByLabel(/Correo del capitán/i)
      .fill(fixtureRegistro.capitan.correo);
    await page.getByLabel(/Teléfono/i).fill(fixtureRegistro.capitan.telefono);

    await page.getByRole('button', { name: /Agregar integrante/i }).click();
    await page
      .getByLabel(/Nombre del integrante 2/i)
      .fill(fixtureRegistro.integranteExtra.nombre);
    await page
      .getByLabel(/Correo del integrante 2/i)
      .fill(fixtureRegistro.integranteExtra.correo);
    await page.getByRole('button', { name: /Siguiente/i }).click();

    // Comprobación de resiliencia (Retroceder)
    await page.getByRole('button', { name: /Atrás/i }).click();
    await expect(page.getByLabel(/Nombre del integrante 2/i)).toHaveValue(
      fixtureRegistro.integranteExtra.nombre,
    );
    await page.getByRole('button', { name: /Siguiente/i }).click();

    // Paso 3: Robot y Documentos (Creación de PDFs ficticios en memoria)
    await page
      .getByLabel(/Nombre del robot/i)
      .fill(fixtureRegistro.robot.nombre);

    // Playwright nos permite crear un buffer falso que simula un PDF sin tener que crear el archivo en tu disco
    const fakePdf = Buffer.from('%PDF-1.4 mock content para pruebas');

    await page
      .getByLabel(/Identificación/i)
      .setInputFiles({
        name: 'identidad.pdf',
        mimeType: 'application/pdf',
        buffer: fakePdf,
      });
    await page
      .getByLabel(/Comprobante/i)
      .setInputFiles({
        name: 'comprobante.pdf',
        mimeType: 'application/pdf',
        buffer: fakePdf,
      });
    await page
      .getByLabel(/Carta/i)
      .setInputFiles({
        name: 'carta.pdf',
        mimeType: 'application/pdf',
        buffer: fakePdf,
      });

    await page.getByRole('button', { name: /Siguiente/i }).click();

    // Paso 4: Revisión y Envío a la ruta real
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/register') &&
        response.request().method() === 'POST',
    );

    await page.getByRole('button', { name: /Enviar registro/i }).click();

    const response = await responsePromise;
    expect(response.status()).toBe(200);
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
