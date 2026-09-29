import { test, expect } from '@playwright/test';
import { fixtureRegistro } from './fixtures/registro';

test('El formulario ficticio conserva datos y no llama al endpoint', async ({
  page,
}) => {
  let llamadasAlEndpoint = 0;
  await page.route('**/api/register', (route) => {
    llamadasAlEndpoint += 1;
    return route.abort();
  });

  await page.goto('/registro');
  await expect(
    page.locator('astro-island:not([ssr]) form.registro-form'),
  ).toBeVisible();
  await page
    .getByLabel('Nombre del equipo')
    .fill(fixtureRegistro.equipo.nombre);
  await page
    .getByLabel('Institución educativa')
    .fill(fixtureRegistro.equipo.institucion);
  await page
    .getByLabel('Estado o ciudad de procedencia')
    .fill('Ciudad Ficticia');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(
    page.getByRole('group', { name: 'Capitán e integrantes' }),
  ).toBeVisible();

  await page
    .getByLabel(/Nombre completo del capitán/)
    .fill(fixtureRegistro.capitan.nombre);
  await page
    .getByLabel('Correo electrónico', { exact: true })
    .fill(fixtureRegistro.capitan.correo);
  await page.getByLabel('Teléfono').fill(fixtureRegistro.capitan.telefono);
  await page
    .getByLabel('Integrante 1: nombre completo')
    .fill(fixtureRegistro.integranteExtra.nombre);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByRole('group', { name: 'Robot' })).toBeVisible();
  await page.getByLabel('Nombre del robot').fill(fixtureRegistro.robot.nombre);
  await page
    .getByLabel(/Descripción del robot/)
    .fill('Robot ficticio de prueba');

  await page.getByRole('button', { name: 'Volver' }).click();
  await expect(
    page.getByRole('group', { name: 'Capitán e integrantes' }),
  ).toBeVisible();
  await expect(page.getByLabel('Integrante 1: nombre completo')).toHaveValue(
    fixtureRegistro.integranteExtra.nombre,
  );
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByRole('group', { name: 'Robot' })).toBeVisible();

  await expect(page.getByLabel('Nombre del robot')).toHaveValue(
    fixtureRegistro.robot.nombre,
  );
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(
    page.getByRole('group', { name: 'Documentos y consentimientos' }),
  ).toBeVisible();

  await expect(page.locator('input[type="file"]')).toHaveCount(3);
  await expect(page.locator('input[type="file"]:disabled')).toHaveCount(3);
  await page.getByLabel(/Acepto el reglamento/).check();
  await page.getByLabel(/Acepto el uso de fotografías/).check();
  await page.getByLabel(/Confirmo que el robot cumple/).check();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(
    page.getByRole('group', { name: 'Revisión antes de enviar' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Enviar registro de prueba' }).click();
  await expect(page.getByRole('status')).toContainText(
    /no representa una inscripción aceptada/i,
  );
  expect(llamadasAlEndpoint).toBe(0);
});
