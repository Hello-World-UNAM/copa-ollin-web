import { test, expect } from '@playwright/test';
import { fixtureRegistro } from './fixtures/registro';

test.describe('Registro de Equipo - Happy Path', () => {
  test('Completa el formulario, conserva datos al retroceder y verifica el sandbox', async ({
    page,
  }) => {
    // 1. Mock de red: interceptar el envío para no contactar servicios reales (Criterio de aceptación)
    await page.route('**/api/registro', async (route) => {
      await route.fulfill({
        status: 200,
        json: {
          success: true,
          sandbox: true,
          message: 'Recibido en entorno de prueba',
        },
      });
    });

    await page.goto('/registro');

    // Paso 1: Información del Equipo
    await page
      .getByLabel(/Nombre del equipo/i)
      .fill(fixtureRegistro.equipo.nombre);
    await page
      .getByLabel(/Institución/i)
      .fill(fixtureRegistro.equipo.institucion);
    await page.getByRole('button', { name: /Siguiente/i }).click();

    // Paso 2: Integrantes (Capitán + 1 Extra)
    await page
      .getByLabel(/Nombre del capitán/i)
      .fill(fixtureRegistro.capitan.nombre);
    await page
      .getByLabel(/Correo del capitán/i)
      .fill(fixtureRegistro.capitan.correo);
    await page.getByLabel(/Teléfono/i).fill(fixtureRegistro.capitan.telefono);

    // Agregar un integrante adicional
    await page.getByRole('button', { name: /Agregar integrante/i }).click();
    await page
      .getByLabel(/Nombre del integrante 2/i)
      .fill(fixtureRegistro.integranteExtra.nombre);
    await page
      .getByLabel(/Correo del integrante 2/i)
      .fill(fixtureRegistro.integranteExtra.correo);
    await page.getByRole('button', { name: /Siguiente/i }).click();

    // Comprobación de resiliencia: Retroceder y verificar que los datos se conservan
    await page.getByRole('button', { name: /Atrás/i }).click();
    await expect(page.getByLabel(/Nombre del integrante 2/i)).toHaveValue(
      fixtureRegistro.integranteExtra.nombre,
    );
    await page.getByRole('button', { name: /Siguiente/i }).click();

    // Paso 3: Robot
    await page
      .getByLabel(/Nombre del robot/i)
      .fill(fixtureRegistro.robot.nombre);
    await page.getByRole('button', { name: /Siguiente/i }).click();

    // Paso 4: Revisión y Envío
    await page.getByRole('button', { name: /Enviar registro/i }).click();

    // Verificación final del mensaje Sandbox
    await expect(
      page.getByText(/Recibido en entorno de prueba/i),
    ).toBeVisible();
  });
});
