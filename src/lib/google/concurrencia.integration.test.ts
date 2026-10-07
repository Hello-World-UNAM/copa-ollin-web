import { randomBytes } from 'node:crypto';
import { config as loadEnv } from 'dotenv';
import { google } from 'googleapis';
import { afterAll, describe, expect, it } from 'vitest';

import { createRegistrationHandler } from '../registration/handler';
import { generarFolio } from './folio';
import { crearFormData, crearRegistroFicticio } from './integracion-comun';
import {
  obtenerMetricasGoogle,
  reiniciarMetricasGoogle,
} from './politica-llamadas';
import { createGoogleSandboxAdapter, prefijoArchivosDrive } from './real';
import {
  createFirestoreReservationStore,
  type RegistrationReservationStore,
} from './reservations';

loadEnv({ quiet: true });

// Opt-in y con escritura: omitida salvo autorización explícita para esta prueba.
const habilitada = process.env.RUN_GOOGLE_SANDBOX_CONCURRENCIA === 'true';
const autorizada = process.env.SANDBOX_GOOGLE_FILE_TEST_AUTHORIZED === 'true';
const describeConcurrencia = habilitada ? describe : describe.skip;

function entero(nombre: string, porDefecto: number, maximo: number): number {
  const valor = Number(process.env[nombre] ?? porDefecto);
  if (!Number.isInteger(valor) || valor < 1 || valor > maximo) {
    throw new Error(`${nombre} debe ser un entero entre 1 y ${maximo}.`);
  }
  return valor;
}

function requerida(nombre: string): string {
  const valor = process.env[nombre]?.trim();
  if (!valor) throw new Error(`Falta configuración local: ${nombre}`);
  return valor;
}

function percentil(valores: number[], p: number): number {
  if (valores.length === 0) return 0;
  const ordenados = [...valores].sort((a, b) => a - b);
  return (
    ordenados[
      Math.min(ordenados.length - 1, Math.ceil(p * ordenados.length) - 1)
    ] ?? 0
  );
}

const PREFIJO_LIMPIEZA = 'qa-conc-';
const soloLimpiar = process.env.SANDBOX_CONCURRENCIA_SOLO_LIMPIAR === 'true';

describeConcurrencia(
  'concurrencia real en el sandbox propio autorizado',
  () => {
    const idEjecucion = randomBytes(4).toString('hex');
    const prefijoId = `qa-conc-${idEjecucion}-`;
    const idsUsados: string[] = [];
    // IDs con RECOVERY_REQUIRED que se conservan a propósito para practicar la recuperación.
    const conservados = new Set<string>();
    const tiendas: RegistrationReservationStore[] = [];

    const oauth = new google.auth.OAuth2(
      process.env.SANDBOX_GOOGLE_OAUTH_CLIENT_ID,
      process.env.SANDBOX_GOOGLE_OAUTH_CLIENT_SECRET,
    );
    oauth.setCredentials({
      refresh_token: process.env.SANDBOX_GOOGLE_OAUTH_REFRESH_TOKEN,
    });
    const sheets = google.sheets({ version: 'v4', auth: oauth });
    const drive = google.drive({ version: 'v3', auth: oauth });

    const configuracion = () => ({
      oauthClientId: requerida('SANDBOX_GOOGLE_OAUTH_CLIENT_ID'),
      oauthClientSecret: requerida('SANDBOX_GOOGLE_OAUTH_CLIENT_SECRET'),
      oauthRefreshToken: requerida('SANDBOX_GOOGLE_OAUTH_REFRESH_TOKEN'),
      spreadsheetId: requerida('SANDBOX_GOOGLE_SPREADSHEET_ID'),
      sheetRange: requerida('SANDBOX_GOOGLE_SHEET_RANGE'),
      driveFolderId: requerida('SANDBOX_GOOGLE_DRIVE_FOLDER_ID'),
    });

    // Cada "instancia" tiene su propio cliente Firestore y su propio adapter,
    // como dos instancias serverless distintas que comparten sólo Firestore.
    function crearTienda() {
      const tienda = createFirestoreReservationStore({
        projectId: requerida('SANDBOX_FIRESTORE_PROJECT_ID'),
        clientEmail: requerida('SANDBOX_FIRESTORE_CLIENT_EMAIL'),
        privateKey: requerida('SANDBOX_FIRESTORE_PRIVATE_KEY'),
      });
      tiendas.push(tienda);
      return tienda;
    }

    function crearInstancia() {
      const tienda = crearTienda();
      const token = requerida('SANDBOX_REGISTRATION_TOKEN');
      const handler = createRegistrationHandler({
        adapter: createGoogleSandboxAdapter({
          config: configuracion(),
          reservationStore: tienda,
        }),
        sandboxEnabled: true,
        sandboxAccessToken: token,
      });
      return (transactionId: string) => {
        const registro = crearRegistroFicticio(transactionId);
        return handler(
          new Request('http://localhost/api/register', {
            method: 'POST',
            headers: { authorization: `Bearer ${token}` },
            body: crearFormData(registro),
          }),
        );
      };
    }

    async function contarEstado(ids: string[]) {
      const config = configuracion();
      const { data } = await sheets.spreadsheets.values.get({
        spreadsheetId: config.spreadsheetId,
        range: config.sheetRange,
        majorDimension: 'ROWS',
      });
      const filasPorId = new Map<string, number>();
      for (const fila of data.values ?? []) {
        const id = String(fila[0] ?? '');
        if (ids.includes(id)) filasPorId.set(id, (filasPorId.get(id) ?? 0) + 1);
      }
      const archivosPorId = new Map<string, number>();
      for (const archivo of await listarArchivosDeLaEjecucion()) {
        const id = ids.find((candidato) =>
          (archivo.name ?? '').startsWith(prefijoArchivosDrive(candidato)),
        );
        if (id) archivosPorId.set(id, (archivosPorId.get(id) ?? 0) + 1);
      }
      return { filasPorId, archivosPorId };
    }

    async function listarArchivosDeLaEjecucion() {
      const config = configuracion();
      const encontrados: { id?: string | null; name?: string | null }[] = [];
      let pageToken: string | undefined;
      do {
        const { data } = await drive.files.list({
          q: `'${config.driveFolderId}' in parents and trashed = false`,
          pageSize: 1000,
          pageToken,
          fields: 'nextPageToken,files(id,name)',
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        });
        encontrados.push(...(data.files ?? []));
        pageToken = data.nextPageToken ?? undefined;
      } while (pageToken);
      // Sólo archivos de esta ejecución: nunca se tocan archivos ajenos.
      const prefijoNombre = `copa-ollin-${PREFIJO_LIMPIEZA}`;
      return encontrados.filter((archivo) =>
        (archivo.name ?? '').startsWith(prefijoNombre),
      );
    }

    async function conReintentoDeCuota<T>(operacion: () => Promise<T>) {
      for (let intento = 1; ; intento += 1) {
        try {
          return await operacion();
        } catch (error) {
          const codigo = (error as { code?: number }).code;
          if (codigo !== 429 || intento >= 6) throw error;
          await new Promise((resolve) => setTimeout(resolve, 65_000));
        }
      }
    }

    async function limpiarFilas(): Promise<string[]> {
      const config = configuracion();
      const { data } = await conReintentoDeCuota(() =>
        sheets.spreadsheets.values.get({
          spreadsheetId: config.spreadsheetId,
          range: config.sheetRange,
          majorDimension: 'ROWS',
        }),
      );
      const encontrados = (data.values ?? [])
        .map((fila, indice) => ({ id: String(fila[0] ?? ''), indice }))
        .filter(
          (fila) =>
            fila.id.startsWith(PREFIJO_LIMPIEZA) && !conservados.has(fila.id),
        );
      if (encontrados.length === 0) return [];
      const pestana = config.sheetRange.split('!')[0];
      const meta = await conReintentoDeCuota(() =>
        sheets.spreadsheets.get({
          spreadsheetId: config.spreadsheetId,
          fields: 'sheets.properties(sheetId,title)',
        }),
      );
      const sheetId = meta.data.sheets?.find(
        (hoja) => hoja.properties?.title === pestana,
      )?.properties?.sheetId;
      if (typeof sheetId === 'number') {
        await conReintentoDeCuota(() =>
          sheets.spreadsheets.batchUpdate({
            spreadsheetId: config.spreadsheetId,
            requestBody: {
              requests: [...encontrados]
                .sort((x, y) => y.indice - x.indice)
                .map(({ indice }) => ({
                  deleteDimension: {
                    range: {
                      sheetId,
                      dimension: 'ROWS',
                      startIndex: indice,
                      endIndex: indice + 1,
                    },
                  },
                })),
            },
          }),
        );
      }
      return encontrados.map((fila) => fila.id);
    }

    async function limpiarArchivos(): Promise<string[]> {
      const ids: string[] = [];
      for (const archivo of await conReintentoDeCuota(
        listarArchivosDeLaEjecucion,
      )) {
        const coincidencia =
          /^copa-ollin-(qa-conc-[0-9a-f]{8}-[a-z0-9]+)-/.exec(
            archivo.name ?? '',
          );
        if (coincidencia?.[1] && conservados.has(coincidencia[1])) continue;
        if (coincidencia?.[1]) ids.push(coincidencia[1]);
        if (archivo.id) {
          const fileId = archivo.id;
          await conReintentoDeCuota(() =>
            drive.files.delete({ fileId, supportsAllDrives: true }),
          );
        }
      }
      return ids;
    }

    // Cada paso es independiente: un fallo (p. ej. cuota) no impide los demás.
    afterAll(async () => {
      const fallos: unknown[] = [];
      const ids = new Set(idsUsados.filter((id) => !conservados.has(id)));
      try {
        for (const id of await limpiarFilas()) ids.add(id);
      } catch (error) {
        fallos.push(error);
      }
      try {
        for (const id of await limpiarArchivos()) ids.add(id);
      } catch (error) {
        fallos.push(error);
      }
      try {
        const limpiador = tiendas[0] ?? crearTienda();
        for (const id of ids) await limpiador.cleanup(id);
      } catch (error) {
        fallos.push(error);
      }
      await Promise.all(tiendas.map((tienda) => tienda.close?.()));
      if (fallos.length > 0) {
        throw new Error(
          'Limpieza incompleta: revisa filas, archivos y reservas con prefijo qa-conc-.',
          { cause: fallos[0] },
        );
      }
    }, 900_000);

    it('mismo ID desde instancias independientes: una sola fila y tres archivos', async () => {
      if (soloLimpiar) return;
      if (!autorizada)
        throw new Error('Falta SANDBOX_GOOGLE_FILE_TEST_AUTHORIZED=true.');
      const solicitudes = entero('SANDBOX_CONCURRENCIA_MISMO_ID', 5, 10);
      const id = `${prefijoId}mismo`;
      idsUsados.push(id);
      reiniciarMetricasGoogle();

      const instancias = Array.from({ length: solicitudes }, crearInstancia);
      const inicio = Date.now();
      const respuestas = await Promise.all(
        instancias.map(async (enviar) => {
          const t0 = Date.now();
          const respuesta = await enviar(id);
          const cuerpo = await respuesta.json();
          return { estado: respuesta.status, cuerpo, ms: Date.now() - t0 };
        }),
      );
      const duracionMs = Date.now() - inicio;

      const { filasPorId, archivosPorId } = await contarEstado([id]);
      const filas = filasPorId.get(id) ?? 0;
      const archivos = archivosPorId.get(id) ?? 0;
      const codigos: Record<string, number> = {};
      for (const r of respuestas)
        codigos[r.cuerpo.code] = (codigos[r.cuerpo.code] ?? 0) + 1;

      console.log(
        `Concurrencia mismo ID: ${JSON.stringify({
          solicitudes,
          duracionMs,
          codigos,
          filas,
          archivos,
          metricas: obtenerMetricasGoogle(),
        })}`,
      );

      expect(filas).toBeLessThanOrEqual(1);
      expect(codigos.SAVED ?? 0).toBeLessThanOrEqual(1);
      if (filas === 1) expect(archivos).toBe(3);
      if (codigos.SAVED) expect(filas).toBe(1);
      for (const r of respuestas.filter((x) => x.estado === 200)) {
        expect(r.cuerpo.folio).toBe(generarFolio(id));
      }
    }, 900_000);

    it('muchos IDs distintos a la vez: sin duplicados ni falsas confirmaciones', async () => {
      if (soloLimpiar) return;
      if (!autorizada)
        throw new Error('Falta SANDBOX_GOOGLE_FILE_TEST_AUTHORIZED=true.');
      const envios = entero('SANDBOX_CONCURRENCIA_ENVIOS', 5, 500);
      const numInstancias = entero('SANDBOX_CONCURRENCIA_INSTANCIAS', 5, 10);
      const ids = Array.from({ length: envios }, (_, i) => `${prefijoId}${i}`);
      idsUsados.push(...ids);
      reiniciarMetricasGoogle();

      const instancias = Array.from(
        { length: Math.min(numInstancias, envios) },
        crearInstancia,
      );
      const inicio = Date.now();
      const respuestas = await Promise.all(
        ids.map(async (id, i) => {
          const t0 = Date.now();
          const respuesta = await instancias[i % instancias.length]!(id);
          const cuerpo = await respuesta.json();
          return { id, estado: respuesta.status, cuerpo, ms: Date.now() - t0 };
        }),
      );
      const duracionMs = Date.now() - inicio;

      const aConservar = Number(
        process.env.SANDBOX_CONCURRENCIA_CONSERVAR_RECUPERACION ?? 0,
      );
      if (Number.isInteger(aConservar) && aConservar >= 1 && aConservar <= 3) {
        respuestas
          .filter((r) => r.cuerpo.code === 'RECOVERY_REQUIRED')
          .slice(0, aConservar)
          .forEach((r) => conservados.add(r.id));
        console.log(
          `Conservados para recuperación (sólo local, no publicar): ${JSON.stringify([...conservados])}`,
        );
      }

      const { filasPorId, archivosPorId } = await contarEstado(ids);
      const guardados = respuestas.filter((r) => r.cuerpo.code === 'SAVED');
      const codigos: Record<string, number> = {};
      for (const r of respuestas)
        codigos[r.cuerpo.code] = (codigos[r.cuerpo.code] ?? 0) + 1;
      const estados: Record<string, number> = {};
      for (const r of respuestas)
        estados[r.estado] = (estados[r.estado] ?? 0) + 1;
      const totalFilas = [...filasPorId.values()].reduce((a, b) => a + b, 0);
      const totalArchivos = [...archivosPorId.values()].reduce(
        (a, b) => a + b,
        0,
      );
      const latencias = respuestas.map((r) => r.ms);

      console.log(
        `Concurrencia IDs distintos: ${JSON.stringify({
          envios,
          instancias: instancias.length,
          duracionMs,
          p50Ms: percentil(latencias, 0.5),
          p95Ms: percentil(latencias, 0.95),
          codigos,
          estados,
          guardados: guardados.length,
          filas: totalFilas,
          archivos: totalArchivos,
          metricas: obtenerMetricasGoogle(),
        })}`,
      );

      // Integridad: nunca una fila repetida y nunca un guardado sin sus datos.
      for (const id of ids)
        expect(filasPorId.get(id) ?? 0).toBeLessThanOrEqual(1);
      for (const r of guardados) {
        expect(filasPorId.get(r.id)).toBe(1);
        expect(archivosPorId.get(r.id)).toBe(3);
        expect(r.cuerpo.folio).toBe(generarFolio(r.id));
      }
      expect(new Set(guardados.map((r) => r.cuerpo.folio)).size).toBe(
        guardados.length,
      );
    }, 900_000);
  },
);
