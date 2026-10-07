import { describe, expect, it } from 'vitest';

import {
  diagnosticarRecuperacion,
  type PuertoDiagnostico,
} from './diagnostico-recuperacion';

function puerto(
  reserva: Awaited<ReturnType<PuertoDiagnostico['leerReserva']>>,
  filas: number,
  archivos: number,
): PuertoDiagnostico {
  return {
    leerReserva: async () => reserva,
    contarFilas: async () => filas,
    contarArchivos: async () => archivos,
  };
}

const recuperacion = {
  estado: 'recovery-required',
  etapa: 'drive-cleanup-failed',
  driveFileIds: ['a', 'b'],
};

describe('diagnosticarRecuperacion', () => {
  it.each<
    [
      string,
      Awaited<ReturnType<PuertoDiagnostico['leerReserva']>>,
      number,
      number,
      string,
    ]
  >([
    [
      'recovery-required sin fila ni archivos',
      recuperacion,
      0,
      0,
      'sin-rastros',
    ],
    [
      'recovery-required con archivos sin fila',
      recuperacion,
      0,
      2,
      'archivos-huerfanos',
    ],
    [
      'recovery-required con fila y 3 archivos',
      recuperacion,
      1,
      3,
      'completar-reserva',
    ],
    [
      'recovery-required con fila y 2 archivos',
      recuperacion,
      1,
      2,
      'investigar',
    ],
    ['recovery-required con filas repetidas', recuperacion, 2, 3, 'investigar'],
    [
      'processing',
      { estado: 'processing', driveFileIds: [] },
      0,
      1,
      'en-proceso',
    ],
    [
      'completed íntegro',
      { estado: 'completed', driveFileIds: [] },
      1,
      3,
      'integro',
    ],
    [
      'completed con faltantes',
      { estado: 'completed', driveFileIds: [] },
      1,
      1,
      'investigar',
    ],
    ['sin reserva y sin rastros', null, 0, 0, 'sin-reserva'],
    ['sin reserva pero íntegro', null, 1, 3, 'integro'],
  ])('%s → %s', async (_nombre, reserva, filas, archivos, esperado) => {
    const diagnostico = await diagnosticarRecuperacion(
      puerto(reserva, filas, archivos),
      'id-ficticio',
    );
    expect(diagnostico.veredicto).toBe(esperado);
  });

  it('es de sólo lectura: sólo usa los métodos de lectura del puerto', async () => {
    const llamadas: string[] = [];
    const p: PuertoDiagnostico = {
      leerReserva: async () => (llamadas.push('reserva'), recuperacion),
      contarFilas: async () => (llamadas.push('filas'), 0),
      contarArchivos: async () => (llamadas.push('archivos'), 0),
    };
    await diagnosticarRecuperacion(p, 'id-ficticio');
    expect(llamadas.sort()).toEqual(['archivos', 'filas', 'reserva']);
  });

  it('informa etapa, antigüedad y archivos referenciados sin exponer IDs', async () => {
    const d = await diagnosticarRecuperacion(
      puerto({ ...recuperacion, antiguedadMinutos: 42 }, 0, 2),
      'id-ficticio',
    );
    expect(d).toMatchObject({
      estado: 'recovery-required',
      etapa: 'drive-cleanup-failed',
      antiguedadMinutos: 42,
      archivosReferenciados: 2,
    });
    expect(JSON.stringify(d)).not.toContain('"a"');
  });
});
