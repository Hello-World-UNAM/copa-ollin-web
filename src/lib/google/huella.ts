import { createHash } from 'node:crypto';

import type { RegistrationData } from './types';

const sha256 = (datos: string | Uint8Array): string =>
  createHash('sha256').update(datos).digest('hex');

/**
 * Huella del contenido del registro: datos normalizados y bytes de los tres
 * documentos. No incluye nombres de archivo, que no forman parte del contrato.
 * Dos solicitudes con el mismo ID y huella distinta son un conflicto.
 */
export async function calcularHuella(data: RegistrationData): Promise<string> {
  const documentos = [
    data.archivoIdentificacion,
    data.comprobantePago,
    data.cartaResponsiva,
  ];
  const huellasDocumentos = await Promise.all(
    documentos.map(async (archivo) => ({
      tipo: archivo.type,
      bytes: archivo.size,
      sha256: sha256(new Uint8Array(await archivo.arrayBuffer())),
    })),
  );

  // Lista explícita y ordenada: el orden de las claves no altera la huella.
  const canonico = JSON.stringify([
    data.transactionId,
    data.nombreEquipo,
    data.categoria,
    data.institucion,
    data.estadoCiudadProcedencia,
    data.nombreCapitan,
    data.correoCapitan,
    data.telefonoCapitan,
    data.identificacionInstitucional ?? '',
    data.integrantes.map(({ nombre, correo }) => [nombre, correo ?? '']),
    data.nombreRobot,
    data.descripcionRobot,
    data.aceptaReglamento,
    data.aceptaUsoImagen,
    data.confirmaRestriccionesCategoria,
    huellasDocumentos,
  ]);
  return sha256(canonico);
}
