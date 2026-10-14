import { describe, expect, it } from 'vitest';

import { generarFolio } from './folio';
import {
  ENCABEZADOS_VISTA_OPERATIVA,
  crearFilaVistaOperativa,
  crearVistaOperativa,
} from './vista-operativa';

const canonica = (extra: unknown[] = []): unknown[] => [
  'reg-ficticio-0001',
  'Equipo Ficticio',
  'micromouse-amateur',
  'Institución Ficticia',
  'Ciudad Ficticia',
  'Capitana Ficticia',
  'capitana@example.invalid',
  '0012345678',
  '',
  JSON.stringify([
    { nombre: 'Integrante Uno', correo: 'uno@example.invalid' },
    { nombre: 'Integrante Dos' },
  ]),
  'Robot Ficticio',
  'Descripción ficticia',
  'TRUE',
  false,
  'true',
  'https://drive.google.invalid/a',
  'https://drive.google.invalid/b',
  'https://drive.google.invalid/c',
  ...extra,
];

describe('vista operativa de Sheets', () => {
  it('tiene tantas columnas como encabezados', () => {
    expect(crearFilaVistaOperativa(canonica())).toHaveLength(
      ENCABEZADOS_VISTA_OPERATIVA.length,
    );
  });

  it('conserva ceros iniciales del teléfono como texto', () => {
    expect(crearFilaVistaOperativa(canonica())[7]).toBe('0012345678');
  });

  it('muestra integrantes legibles, categoría con nombre y Sí/No', () => {
    const fila = crearFilaVistaOperativa(canonica());
    expect(fila[2]).toBe('Micromouse amateur');
    expect(fila[9]).toBe(
      '1. Integrante Uno <uno@example.invalid>\n2. Integrante Dos',
    );
    expect(fila.slice(11, 14)).toEqual(['Sí', 'No', 'Sí']);
  });

  it('usa el folio persistido y deriva el mismo para filas sin folio', () => {
    const derivado = generarFolio('reg-ficticio-0001');
    expect(crearFilaVistaOperativa(canonica())[0]).toBe(derivado);
    expect(crearFilaVistaOperativa(canonica(['CO-PERSIST-0000']))[0]).toBe(
      'CO-PERSIST-0000',
    );
  });

  it('no destruye la fila canónica ni pierde el ID técnico', () => {
    const original = canonica();
    const copia = structuredClone(original);
    const fila = crearFilaVistaOperativa(original);
    expect(original).toEqual(copia);
    expect(fila[17]).toBe('reg-ficticio-0001');
  });

  it('tolera JSON de integrantes ilegible sin lanzar', () => {
    const fila = canonica();
    fila[9] = '{no-es-json';
    expect(crearFilaVistaOperativa(fila)[9]).toBe('{no-es-json');
  });

  it('transforma varias filas manteniendo el orden', () => {
    const vista = crearVistaOperativa([canonica(), canonica()]);
    expect(vista).toHaveLength(2);
  });
});
