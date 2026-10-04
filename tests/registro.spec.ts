import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { fixtureRegistro, tokenSandboxE2e } from './fixtures/registro';

const pdf = (name: string) => ({
  name,
  mimeType: 'application/pdf',
  buffer: Buffer.from('%PDF-1.4\n%%EOF\n'),
});

async function llenarHastaDocumentos(page: Page) {
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

  await page.getByLabel('Nombre del robot').fill(fixtureRegistro.robot.nombre);
  await page
    .getByLabel(/Descripción del robot/)
    .fill('Robot ficticio de prueba');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(
    page.getByRole('group', { name: 'Documentos y consentimientos' }),
  ).toBeVisible();
}

async function completarDocumentosYRevisar(page: Page) {
  await page
    .locator('#documento-archivoIdentificacion')
    .setInputFiles(pdf('identificacion.pdf'));
  await page
    .locator('#documento-comprobantePago')
    .setInputFiles(pdf('comprobante.pdf'));
  await page
    .locator('#documento-cartaResponsiva')
    .setInputFiles(pdf('carta.pdf'));
  await expect(page.getByText(/Archivo seleccionado/)).toHaveCount(3);
  await page.getByLabel(/Acepto el reglamento/).check();
  await page.getByLabel(/Acepto el uso de fotografías/).check();
  await page.getByLabel(/Confirmo que el robot cumple/).check();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(
    page.getByRole('group', { name: 'Revisión antes de enviar' }),
  ).toBeVisible();
}

const respuestaGuardada = {
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify({ code: 'SAVED', message: 'ok', isDuplicate: false }),
};

test('completa el envío al handler local autorizado con adapter mock', async ({
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
  await llenarHastaDocumentos(page);
  await completarDocumentosYRevisar(page);
  const respuesta = page.waitForResponse(
    (response) =>
      response.url().includes('/api/register') &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Enviar registro de prueba' }).click();
  const recibida = await respuesta;
  expect(recibida.status()).toBe(200);
  expect(await recibida.json()).toMatchObject({ code: 'SAVED' });
  await expect(page.getByRole('status')).toContainText(
    /no representa una inscripción aceptada/i,
  );
});

test('auditoría de accesibilidad y línea base de rendimiento', async ({
  page,
}) => {
  const inicio = Date.now();
  await page.goto('/registro');
  expect(Date.now() - inicio).toBeLessThan(3000);
  await expect(
    page.locator('astro-island:not([ssr]) form.registro-form'),
  ).toBeVisible();
  const auditoria = await new AxeBuilder({ page }).analyze();
  expect(auditoria.violations).toEqual([]);
});

test('un fallo de red conserva datos y archivos y el reintento usa el mismo identificador', async ({
  page,
}) => {
  const peticiones: string[] = [];
  await page.route('**/api/register', (route) => {
    peticiones.push(route.request().postData() ?? '');
    return peticiones.length === 1
      ? route.abort()
      : route.fulfill(respuestaGuardada);
  });

  await llenarHastaDocumentos(page);
  await completarDocumentosYRevisar(page);
  const enviar = page.getByRole('button', {
    name: 'Enviar registro de prueba',
  });

  await enviar.click();
  await expect(page.locator('.registro-resultado')).toContainText(
    /No se pudo conectar/,
  );
  await expect(page.getByText(/identificacion\.pdf/)).toBeVisible();

  await enviar.click();
  await expect(page.getByRole('status')).toContainText(
    /no representa una inscripción aceptada/i,
  );

  const id = (cuerpo: string) =>
    /name="transactionId"\r\n\r\n([^\r\n]+)/.exec(cuerpo)?.[1];
  expect(id(peticiones[0] ?? '')).toBeTruthy();
  expect(id(peticiones[0] ?? '')).toBe(id(peticiones[1] ?? ''));
  expect(peticiones[1]).toContain(
    'name="comprobantePago"; filename="comprobante.pdf"',
  );
});

test('un doble clic genera una sola petición', async ({ page }) => {
  let llamadas = 0;
  await page.route('**/api/register', async (route) => {
    llamadas += 1;
    await new Promise((resolve) => setTimeout(resolve, 300));
    return route.fulfill(respuestaGuardada);
  });

  await llenarHastaDocumentos(page);
  await completarDocumentosYRevisar(page);
  await page
    .getByRole('button', { name: 'Enviar registro de prueba' })
    .dblclick();
  await expect(page.getByRole('status')).toBeVisible();
  expect(llamadas).toBe(1);
});

test('un archivo que no es PDF se rechaza en el cliente', async ({ page }) => {
  await llenarHastaDocumentos(page);
  await page.locator('#documento-comprobantePago').setInputFiles({
    name: 'x.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('hola'),
  });
  await expect(page.getByText(/Solo se aceptan archivos PDF/)).toBeVisible();
});

test('un error 502 del servidor no se presenta como éxito y conserva los archivos', async ({
  page,
}) => {
  await page.route('**/api/register', (route) =>
    route.fulfill({
      status: 502,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'TEMPORARY_STORAGE_ERROR' }),
    }),
  );

  await llenarHastaDocumentos(page);
  await completarDocumentosYRevisar(page);
  await page.getByRole('button', { name: 'Enviar registro de prueba' }).click();
  await expect(page.locator('.registro-resultado')).toContainText(
    /almacenamiento de pruebas no respondió/,
  );
  await expect(page.getByRole('status')).toHaveCount(0);
});
