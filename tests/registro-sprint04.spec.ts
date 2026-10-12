import { test, expect, type Page } from '@playwright/test';
import { fixtureRegistro } from './fixtures/registro';
import { respuestasSprint04 } from './fixtures/sprint04/registro';

// Todas las pruebas usan transporte simulado (page.route): no tocan Google
// ni el backend y no inyectan cabeceras de autenticación.

const pdf = (name: string) => ({
  name,
  mimeType: 'application/pdf',
  buffer: Buffer.from('%PDF-1.4\n%%EOF\n'),
});

async function llenarEquipo(page: Page) {
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
    .fill(fixtureRegistro.equipo.procedencia);
  await page.getByRole('button', { name: 'Continuar' }).click();
}

async function llenarCapitan(page: Page) {
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
}

async function llenarHastaDocumentos(page: Page) {
  await llenarEquipo(page);
  await llenarCapitan(page);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByLabel('Nombre del robot').fill(fixtureRegistro.robot.nombre);
  await page
    .getByLabel(/Descripción del robot/)
    .fill(fixtureRegistro.robot.descripcion);
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

const enviar = (page: Page) =>
  page.getByRole('button', { name: 'Enviar registro de prueba' }).click();

const fulfill = (page: Page, status: number, body: unknown) =>
  page.route('**/api/register', (route) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    }),
  );

test.describe('Sprint 4 · registro (transporte simulado)', () => {
  for (const codigo of ['SAVED', 'DUPLICATE']) {
    test(`${codigo} muestra el folio y permite copiarlo`, async ({ page }) => {
      const escenario = respuestasSprint04.find((r) => r.body.code === codigo);
      if (!escenario) throw new Error(`Falta el fixture ${codigo}`);
      await fulfill(page, escenario.status, escenario.body);
      await llenarHastaDocumentos(page);
      await completarDocumentosYRevisar(page);
      await enviar(page);
      await expect(page.getByText('Guarda este folio:')).toBeVisible();
      await expect(page.getByText('PRUEBA-FOLIO-0001')).toBeVisible();
      await expect(
        page.getByRole('button', { name: 'Copiar folio' }),
      ).toBeVisible();
      await expect(page.getByRole('status')).toContainText(
        /no representa una inscripción aceptada/i,
      );
    });
  }

  test('respuesta sin folio no muestra referencia inventada', async ({
    page,
  }) => {
    await fulfill(page, 200, {
      code: 'SAVED',
      message: 'ok',
      isDuplicate: false,
    });
    await llenarHastaDocumentos(page);
    await completarDocumentosYRevisar(page);
    await enviar(page);
    await expect(page.getByRole('status')).toContainText(
      'Registro de prueba recibido',
    );
    await expect(page.getByText('Guarda este folio:')).toHaveCount(0);
  });

  test('409 no se presenta como éxito y conserva los datos', async ({
    page,
  }) => {
    const conflicto = respuestasSprint04.find((r) => r.status === 409);
    if (!conflicto) throw new Error('Falta el fixture 409');
    await fulfill(page, conflicto.status, conflicto.body);
    await llenarHastaDocumentos(page);
    await completarDocumentosYRevisar(page);
    await enviar(page);
    await expect(page.locator('.registro-resultado')).toContainText(
      'Este identificador ya corresponde a otros datos',
    );
    await expect(page.getByRole('status')).toHaveCount(0);
    await expect(page.getByText(/identificacion\.pdf/)).toBeVisible();
  });

  const errores: Array<[number, string, string]> = [
    [401, 'SANDBOX_UNAUTHORIZED', 'Falta autorización para enviar la prueba'],
    [413, 'PAYLOAD_TOO_LARGE', 'Los archivos son demasiado grandes'],
    [502, 'RECOVERY_REQUIRED', 'No pudimos confirmar el guardado'],
    [503, 'SANDBOX_DISABLED', 'El registro de pruebas no está disponible'],
  ];
  for (const [status, code, titulo] of errores) {
    test(`${status} ${code} muestra un estado accionable`, async ({ page }) => {
      await fulfill(page, status, { code });
      await llenarHastaDocumentos(page);
      await completarDocumentosYRevisar(page);
      await enviar(page);
      await expect(page.locator('.registro-resultado')).toContainText(titulo);
      await expect(page.getByRole('status')).toHaveCount(0);
    });
  }

  test('tras un envío incierto, datos modificados no se reenvían con el mismo identificador', async ({
    page,
  }) => {
    let peticiones = 0;
    await page.route('**/api/register', (route) => {
      peticiones += 1;
      return route.abort();
    });
    await llenarHastaDocumentos(page);
    await completarDocumentosYRevisar(page);
    await enviar(page);
    await expect(page.locator('.registro-resultado')).toContainText(
      /No se pudo conectar/,
    );

    await page.getByRole('button', { name: 'Volver' }).click();
    await page.getByRole('button', { name: 'Volver' }).click();
    await page.getByLabel('Nombre del robot').fill('Robot Modificado');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await enviar(page);

    await expect(page.locator('.registro-resultado')).toContainText(
      'Cambiaste datos después de un envío incierto',
    );
    expect(peticiones).toBe(1);
  });

  test('correo inválido de integrante: error junto al campo y foco', async ({
    page,
  }) => {
    await llenarEquipo(page);
    await llenarCapitan(page);
    const correo = page.getByLabel('Correo electrónico (Opcional)');
    await correo.fill('no-es-correo');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByText('Escribe un correo válido.')).toBeVisible();
    await expect(correo).toHaveAttribute('aria-invalid', 'true');
    await expect(correo).toHaveAttribute(
      'aria-describedby',
      'integrantes.0.correo-error',
    );
    await expect(correo).toBeFocused();

    await correo.fill('');
    await page.getByRole('button', { name: 'Continuar' }).click();
    await expect(page.getByRole('group', { name: 'Robot' })).toBeVisible();
  });

  test('teléfono: sólo dígitos al escribir y pegar, conserva ceros', async ({
    page,
  }) => {
    await llenarEquipo(page);
    const telefono = page.getByLabel('Teléfono');
    await expect(telefono).toHaveAttribute('inputmode', 'numeric');
    await telefono.fill('abc123');
    await expect(telefono).toHaveValue('123');
    await expect(
      page.getByText('Solo se admiten dígitos; quitamos los demás caracteres.'),
    ).toBeVisible();
    await telefono.fill('00 12-34');
    await expect(telefono).toHaveValue('001234');
  });

  test('un reemplazo inválido no sustituye al archivo válido', async ({
    page,
  }) => {
    await llenarHastaDocumentos(page);
    const campo = page.locator('#documento-comprobantePago');
    await campo.setInputFiles(pdf('valido.pdf'));
    await expect(page.getByText(/valido\.pdf/)).toBeVisible();
    await campo.setInputFiles({
      name: 'malo.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('hola'),
    });
    await expect(page.getByText(/Solo se aceptan archivos PDF/)).toBeVisible();
    await expect(page.getByText(/valido\.pdf/)).toBeVisible();
  });

  test('el comprobante acepta PNG y la identificación no', async ({ page }) => {
    await llenarHastaDocumentos(page);
    const png = {
      name: 'pago.png',
      mimeType: 'image/png',
      buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0]),
    };
    await page.locator('#documento-comprobantePago').setInputFiles(png);
    await expect(page.getByText(/pago\.png/)).toBeVisible();
    await page.locator('#documento-archivoIdentificacion').setInputFiles(png);
    await expect(page.getByText(/Solo se aceptan archivos PDF/)).toBeVisible();
  });

  test('volver conserva los tres archivos', async ({ page }) => {
    await llenarHastaDocumentos(page);
    await completarDocumentosYRevisar(page);
    await page.getByRole('button', { name: 'Volver' }).click();
    await expect(page.getByText(/Archivo seleccionado/)).toHaveCount(3);
  });

  test('la revisión muestra los datos completos del kit', async ({ page }) => {
    await llenarHastaDocumentos(page);
    await completarDocumentosYRevisar(page);
    const revision = page.getByRole('group', {
      name: 'Revisión antes de enviar',
    });
    for (const texto of [
      fixtureRegistro.equipo.institucion,
      fixtureRegistro.equipo.procedencia,
      fixtureRegistro.capitan.correo,
      fixtureRegistro.capitan.telefono,
      fixtureRegistro.integranteExtra.nombre,
      fixtureRegistro.robot.descripcion,
      'Reglamento: Sí',
    ]) {
      await expect(revision).toContainText(texto);
    }
  });
});
