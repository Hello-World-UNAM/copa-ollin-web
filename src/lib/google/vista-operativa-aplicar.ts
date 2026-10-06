import {
  ENCABEZADOS_VISTA_OPERATIVA,
  crearVistaOperativa,
} from './vista-operativa';

export const PESTANA_CANONICA = 'Registros';
export const PESTANA_VISTA = 'Vista CROFI';

export interface PuertoSheetsVista {
  getValues(rango: string): Promise<unknown[][]>;
  listarPestanas(): Promise<{ titulo: string; id: number }[]>;
  updateValues(rango: string, valores: string[][]): Promise<void>;
  clearValues(rango: string): Promise<void>;
  batchUpdate(solicitudes: object[]): Promise<{ sheetIdCreado?: number }>;
}

export interface PlanVista {
  escribirEncabezadoFolio: boolean;
  crearPestana: boolean;
  filas: number;
  columnas: number;
}

export interface ResultadoVista extends PlanVista {
  aplicado: boolean;
}

/**
 * Deriva la pestaña legible desde `Registros`. Por defecto sólo planifica
 * (lecturas); escribe únicamente con `confirmar: true`. Nunca modifica filas
 * de `Registros`: como máximo añade el encabezado `folio` en S1 si está vacío.
 */
export async function aplicarVistaOperativa(
  puerto: PuertoSheetsVista,
  opciones: { confirmar?: boolean } = {},
): Promise<ResultadoVista> {
  const registros = await puerto.getValues(`${PESTANA_CANONICA}!A:S`);
  const [encabezados = [], ...filas] = registros;
  const datos = crearVistaOperativa(filas.filter((fila) => fila.length > 0));
  const pestanas = await puerto.listarPestanas();
  const vista = pestanas.find(({ titulo }) => titulo === PESTANA_VISTA);

  const plan: PlanVista = {
    escribirEncabezadoFolio: !String(encabezados[18] ?? '').trim(),
    crearPestana: !vista,
    filas: datos.length,
    columnas: ENCABEZADOS_VISTA_OPERATIVA.length,
  };
  if (!opciones.confirmar) return { ...plan, aplicado: false };

  if (plan.escribirEncabezadoFolio) {
    await puerto.updateValues(`${PESTANA_CANONICA}!S1`, [['folio']]);
  }

  let sheetId = vista?.id;
  if (plan.crearPestana) {
    const { sheetIdCreado } = await puerto.batchUpdate([
      { addSheet: { properties: { title: PESTANA_VISTA } } },
    ]);
    sheetId = sheetIdCreado;
  } else {
    await puerto.clearValues(`${PESTANA_VISTA}!A:Z`);
  }
  if (sheetId === undefined) {
    throw new Error('No se pudo identificar la pestaña de la vista.');
  }

  await puerto.updateValues(`${PESTANA_VISTA}!A1`, [
    [...ENCABEZADOS_VISTA_OPERATIVA],
    ...datos,
  ]);
  await puerto.batchUpdate([
    {
      updateSheetProperties: {
        properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
        fields: 'gridProperties.frozenRowCount',
      },
    },
    {
      setBasicFilter: {
        filter: {
          range: {
            sheetId,
            startRowIndex: 0,
            endRowIndex: datos.length + 1,
            startColumnIndex: 0,
            endColumnIndex: ENCABEZADOS_VISTA_OPERATIVA.length,
          },
        },
      },
    },
  ]);
  return { ...plan, aplicado: true };
}
