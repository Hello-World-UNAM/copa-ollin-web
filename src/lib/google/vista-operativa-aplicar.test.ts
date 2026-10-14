import { describe, expect, it } from 'vitest';

import { ENCABEZADOS_VISTA_OPERATIVA } from './vista-operativa';
import {
  PESTANA_VISTA,
  aplicarVistaOperativa,
  type PuertoSheetsVista,
} from './vista-operativa-aplicar';

const fila = (id: string): unknown[] => [
  id,
  'Equipo Ficticio',
  'micromouse-amateur',
  'Institución Ficticia',
  'Ciudad Ficticia',
  'Capitana Ficticia',
  'c@example.invalid',
  '0012345678',
  '',
  JSON.stringify([{ nombre: 'Integrante Ficticio' }]),
  'Robot Ficticio',
  'Descripción',
  'TRUE',
  'FALSE',
  'TRUE',
  'https://x.invalid/a',
  'https://x.invalid/b',
  'https://x.invalid/c',
];

function crearPuerto(opciones: { conVista?: boolean; folioS1?: string } = {}) {
  const escrituras: string[] = [];
  const lotes: object[][] = [];
  const valores = new Map<string, string[][]>();
  const encabezados = Array.from({ length: 18 }, (_, i) => `h${i}`);
  if (opciones.folioS1) encabezados.push(opciones.folioS1);
  const puerto: PuertoSheetsVista = {
    async getValues() {
      return [encabezados, fila('reg-ficticio-001'), fila('reg-ficticio-002')];
    },
    async listarPestanas() {
      return [
        { titulo: 'Registros', id: 1 },
        ...(opciones.conVista ? [{ titulo: PESTANA_VISTA, id: 2 }] : []),
      ];
    },
    async updateValues(rango, v) {
      escrituras.push(`update:${rango}`);
      valores.set(rango, v);
    },
    async clearValues(rango) {
      escrituras.push(`clear:${rango}`);
    },
    async batchUpdate(s) {
      escrituras.push('batch');
      lotes.push(s);
      return { sheetIdCreado: 2 };
    },
  };
  return { puerto, escrituras, lotes, valores };
}

describe('aplicarVistaOperativa', () => {
  it('por defecto sólo planifica: cero escrituras', async () => {
    const { puerto, escrituras } = crearPuerto();
    const r = await aplicarVistaOperativa(puerto);
    expect(r).toMatchObject({ aplicado: false, filas: 2, crearPestana: true });
    expect(r.escribirEncabezadoFolio).toBe(true);
    expect(escrituras).toEqual([]);
  });

  it('con confirmación crea la pestaña, escribe encabezados, congela y filtra', async () => {
    const { puerto, valores, lotes } = crearPuerto();
    const r = await aplicarVistaOperativa(puerto, { confirmar: true });
    expect(r.aplicado).toBe(true);
    const escrito = valores.get(`${PESTANA_VISTA}!A1`);
    expect(escrito?.[0]).toEqual([...ENCABEZADOS_VISTA_OPERATIVA]);
    expect(escrito).toHaveLength(3);
    expect(JSON.stringify(lotes)).toContain('setBasicFilter');
    expect(JSON.stringify(lotes)).toContain('frozenRowCount');
  });

  it('sólo toca Registros para el encabezado folio en S1', async () => {
    const { puerto, escrituras } = crearPuerto();
    await aplicarVistaOperativa(puerto, { confirmar: true });
    const sobreRegistros = escrituras.filter((e) => e.includes('Registros'));
    expect(sobreRegistros).toEqual(['update:Registros!S1']);
  });

  it('no sobrescribe un encabezado S1 existente', async () => {
    const { puerto, escrituras } = crearPuerto({ folioS1: 'Folio' });
    await aplicarVistaOperativa(puerto, { confirmar: true });
    expect(escrituras.some((e) => e.includes('Registros'))).toBe(false);
  });

  it('es repetible: si la vista existe la limpia en lugar de duplicarla', async () => {
    const { puerto, escrituras } = crearPuerto({ conVista: true });
    const r = await aplicarVistaOperativa(puerto, { confirmar: true });
    expect(r.crearPestana).toBe(false);
    expect(escrituras).toContain(`clear:${PESTANA_VISTA}!A:Z`);
  });
});
