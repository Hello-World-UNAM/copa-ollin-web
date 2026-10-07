import { describe, expect, it, vi } from 'vitest';

import {
  crearPuertoSheetsGoogle,
  type ClienteSheetsVista,
} from './vista-operativa-google';

function crearCliente() {
  const update = vi.fn(async () => ({}));
  const clear = vi.fn(async () => ({}));
  const batchUpdate = vi.fn(async () => ({
    data: { replies: [{ addSheet: { properties: { sheetId: 77 } } }] },
  }));
  const cliente: ClienteSheetsVista = {
    spreadsheets: {
      get: async () => ({
        data: {
          sheets: [
            { properties: { title: 'Registros', sheetId: 1 } },
            { properties: { title: null, sheetId: 5 } },
          ],
        },
      }),
      batchUpdate,
      values: {
        get: async () => ({ data: { values: null } }),
        update,
        clear,
      },
    },
  };
  return { cliente, update, clear, batchUpdate };
}

describe('crearPuertoSheetsGoogle', () => {
  it('lista sólo pestañas completas y devuelve [] si no hay valores', async () => {
    const { cliente } = crearCliente();
    const puerto = crearPuertoSheetsGoogle(cliente, 'hoja-ficticia');
    expect(await puerto.listarPestanas()).toEqual([
      { titulo: 'Registros', id: 1 },
    ]);
    expect(await puerto.getValues('Registros!A:S')).toEqual([]);
  });

  it('escribe en RAW para conservar ceros iniciales', async () => {
    const { cliente, update } = crearCliente();
    await crearPuertoSheetsGoogle(cliente, 'hoja-ficticia').updateValues(
      'Vista CROFI!A1',
      [['0012345678']],
    );
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ valueInputOption: 'RAW' }),
    );
  });

  it('devuelve el sheetId de la pestaña creada', async () => {
    const { cliente } = crearCliente();
    const puerto = crearPuertoSheetsGoogle(cliente, 'hoja-ficticia');
    expect(await puerto.batchUpdate([{}])).toEqual({ sheetIdCreado: 77 });
  });
});
