import type { ArchivosRegistro } from './formData';
import type { RegistroPayload } from './schema';

export const payloadFicticio: RegistroPayload = {
  nombreEquipo: 'Equipo Prueba 01',
  categoria: 'micromouse-amateur',
  institucion: 'Institución Ficticia',
  estadoCiudadProcedencia: 'Ciudad Ficticia',
  nombreCapitan: 'Capitana Ficticia',
  correoCapitan: 'capitana@example.invalid',
  telefonoCapitan: '5555555555',
  identificacionInstitucional: '',
  integrantes: [
    { nombre: 'Integrante Ficticio Uno', correo: '' },
    { nombre: 'Integrante Ficticio Dos', correo: 'dos@example.invalid' },
  ],
  nombreRobot: 'Robot Ficticio',
  descripcionRobot: 'Robot ficticio de prueba.',
  aceptaReglamento: true,
  aceptaUsoImagen: true,
  confirmaRestriccionesCategoria: true,
};

export function crearPdfFicticio(nombre: string, bytesTotales?: number): File {
  const base = '%PDF-1.4\n%%EOF\n';
  const contenido =
    bytesTotales && bytesTotales > base.length
      ? base + 'a'.repeat(bytesTotales - base.length)
      : base;
  return new File([contenido], nombre, { type: 'application/pdf' });
}

export function archivosFicticios(): ArchivosRegistro {
  return {
    archivoIdentificacion: crearPdfFicticio('identificacion.pdf'),
    comprobantePago: crearPdfFicticio('comprobante.pdf'),
    cartaResponsiva: crearPdfFicticio('carta.pdf'),
  };
}
