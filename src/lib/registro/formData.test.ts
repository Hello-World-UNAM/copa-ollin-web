import { describe, expect, it } from 'vitest';
import { categories } from '../../data/categories';
import type { RegistroPayload } from './schema';
import { crearRegistroFormData } from './formData';

const [primeraCategoria] = categories;
if (!primeraCategoria) {
  throw new Error('El catálogo de categorías está vacío.');
}

const crearPdfFicticio = (nombre: string) =>
  new File(['%PDF-1.4 ficticio'], nombre, { type: 'application/pdf' });

const payloadFicticio: RegistroPayload = {
  transactionId: '00000000-0000-4000-8000-000000000010',
  nombreEquipo: 'Equipo Ficticio 01',
  categoria: primeraCategoria.slug,
  institucion: 'Institución Ficticia',
  estadoCiudadProcedencia: 'Ciudad Ficticia',
  nombreCapitan: 'Capitana Ficticia',
  correoCapitan: 'capitana@example.invalid',
  telefonoCapitan: '0000000000',
  identificacionInstitucional: '',
  integrantes: [{ nombre: 'Integrante Ficticio', correo: '' }],
  nombreRobot: 'Robot Ficticio',
  descripcionRobot: 'Descripción de prueba ficticia.',
  aceptaReglamento: true,
  aceptaUsoImagen: false,
  confirmaRestriccionesCategoria: true,
  archivoIdentificacion: crearPdfFicticio('identificacion-ficticia.pdf'),
  comprobantePago: crearPdfFicticio('comprobante-ficticio.pdf'),
  cartaResponsiva: crearPdfFicticio('carta-ficticia.pdf'),
};

describe('crearRegistroFormData', () => {
  it('serializa los 18 campos con los nombres que recibe el endpoint', () => {
    const formData = crearRegistroFormData(payloadFicticio);

    expect([...formData.keys()]).toEqual([
      'transactionId',
      'nombreEquipo',
      'categoria',
      'institucion',
      'estadoCiudadProcedencia',
      'nombreCapitan',
      'correoCapitan',
      'telefonoCapitan',
      'identificacionInstitucional',
      'integrantes',
      'nombreRobot',
      'descripcionRobot',
      'aceptaReglamento',
      'aceptaUsoImagen',
      'confirmaRestriccionesCategoria',
      'archivoIdentificacion',
      'comprobantePago',
      'cartaResponsiva',
    ]);
    expect(formData.get('transactionId')).toBe(payloadFicticio.transactionId);
    expect(formData.get('integrantes')).toBe(
      JSON.stringify(payloadFicticio.integrantes),
    );
    expect(formData.get('aceptaReglamento')).toBe('true');
    expect(formData.get('aceptaUsoImagen')).toBe('false');
    expect(formData.get('archivoIdentificacion')).toMatchObject({
      name: 'identificacion-ficticia.pdf',
      type: 'application/pdf',
    });
  });
});
