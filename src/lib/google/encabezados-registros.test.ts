import { describe, expect, it } from 'vitest';

import {
  ENCABEZADOS_REGISTROS,
  ENCABEZADOS_VISTA_OPERATIVA,
} from './vista-operativa';

describe('encabezados de Registros', () => {
  it('tienen 19 columnas con Folio en la última (S)', () => {
    expect(ENCABEZADOS_REGISTROS).toHaveLength(19);
    expect(ENCABEZADOS_REGISTROS[18]).toBe('Folio');
  });

  it('no repiten nombres', () => {
    expect(new Set(ENCABEZADOS_REGISTROS).size).toBe(19);
  });

  it('coinciden con los de la Vista CROFI en las columnas equivalentes', () => {
    const compartidos = ENCABEZADOS_VISTA_OPERATIVA.filter((nombre) =>
      ENCABEZADOS_REGISTROS.includes(nombre as never),
    );
    // Todos los de la vista existen en Registros salvo los que se derivan.
    expect(compartidos.length).toBeGreaterThanOrEqual(16);
  });
});
