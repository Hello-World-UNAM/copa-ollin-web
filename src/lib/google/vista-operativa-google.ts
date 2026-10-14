import type { PuertoSheetsVista } from './vista-operativa-aplicar';

// Subconjunto de la API de Sheets que usa la vista; permite probarla sin red.
export interface ClienteSheetsVista {
  spreadsheets: {
    get(params: { spreadsheetId: string; fields: string }): Promise<{
      data: {
        sheets?: {
          properties?: { title?: string | null; sheetId?: number | null };
        }[];
      };
    }>;
    batchUpdate(params: {
      spreadsheetId: string;
      requestBody: { requests: object[] };
    }): Promise<{
      data: {
        replies?: {
          addSheet?: { properties?: { sheetId?: number | null } };
        }[];
      };
    }>;
    values: {
      get(params: {
        spreadsheetId: string;
        range: string;
        majorDimension: 'ROWS';
      }): Promise<{ data: { values?: unknown[][] | null } }>;
      update(params: {
        spreadsheetId: string;
        range: string;
        valueInputOption: 'RAW';
        requestBody: { values: string[][] };
      }): Promise<unknown>;
      clear(params: { spreadsheetId: string; range: string }): Promise<unknown>;
    };
  };
}

/** Puerto de Sheets para la vista. Escribe siempre en RAW para conservar texto. */
export function crearPuertoSheetsGoogle(
  cliente: ClienteSheetsVista,
  spreadsheetId: string,
): PuertoSheetsVista {
  return {
    async getValues(rango) {
      const { data } = await cliente.spreadsheets.values.get({
        spreadsheetId,
        range: rango,
        majorDimension: 'ROWS',
      });
      return data.values ?? [];
    },
    async listarPestanas() {
      const { data } = await cliente.spreadsheets.get({
        spreadsheetId,
        fields: 'sheets(properties(title,sheetId))',
      });
      return (data.sheets ?? []).flatMap(({ properties }) =>
        properties?.title != null && properties.sheetId != null
          ? [{ titulo: properties.title, id: properties.sheetId }]
          : [],
      );
    },
    async updateValues(rango, valores) {
      await cliente.spreadsheets.values.update({
        spreadsheetId,
        range: rango,
        valueInputOption: 'RAW',
        requestBody: { values: valores },
      });
    },
    async clearValues(rango) {
      await cliente.spreadsheets.values.clear({
        spreadsheetId,
        range: rango,
      });
    },
    async batchUpdate(solicitudes) {
      const { data } = await cliente.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests: solicitudes },
      });
      const sheetIdCreado = data.replies?.[0]?.addSheet?.properties?.sheetId;
      return sheetIdCreado == null ? {} : { sheetIdCreado };
    },
  };
}
