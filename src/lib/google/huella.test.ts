import { describe, expect, it } from 'vitest';

import { calcularHuella } from './huella';
import { createFakeRegistrationData } from './mock';

const pdf = (contenido: string, nombre = 'a.pdf') =>
  new File(['%PDF-1.4 ', contenido], nombre, { type: 'application/pdf' });

const datos = (contenido = 'x', cambio: object = {}) => ({
  ...createFakeRegistrationData('huella-ficticia-001', {
    archivoIdentificacion: pdf(contenido),
    comprobantePago: pdf('b'),
    cartaResponsiva: pdf('c'),
  }),
  ...cambio,
});

describe('calcularHuella', () => {
  it('es igual para el mismo contenido, aunque cambien nombres de archivo', async () => {
    const a = datos();
    const b = {
      ...datos(),
      archivoIdentificacion: pdf('x', 'otro-nombre.pdf'),
    };
    expect(await calcularHuella(a)).toBe(await calcularHuella(b));
  });

  it('cambia si cambia un campo', async () => {
    expect(await calcularHuella(datos())).not.toBe(
      await calcularHuella(datos('x', { nombreEquipo: 'Otro equipo' })),
    );
  });

  it('cambia si cambian los bytes de un documento con igual tamaño', async () => {
    expect(await calcularHuella(datos('x'))).not.toBe(
      await calcularHuella(datos('y')),
    );
  });

  it('cambia si cambian los integrantes', async () => {
    expect(await calcularHuella(datos())).not.toBe(
      await calcularHuella(datos('x', { integrantes: [] })),
    );
  });
});
