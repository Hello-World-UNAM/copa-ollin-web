import {
  CAMPOS_ARCHIVO,
  CAMPOS_ESCALARES,
  type CampoArchivo,
  type CampoEscalar,
} from './contract';
import type { RegistroPayload } from './schema';

export type ArchivosRegistro = Record<CampoArchivo, File>;

export function construirFormData(
  payload: RegistroPayload,
  archivos: ArchivosRegistro,
  transactionId: string,
): FormData {
  // El servidor rechaza correo '' (z.email): se omite si está vacío.
  const integrantes = payload.integrantes.map(({ nombre, correo }) =>
    correo ? { nombre, correo } : { nombre },
  );

  const escalares: Record<CampoEscalar, string> = {
    transactionId,
    nombreEquipo: payload.nombreEquipo,
    categoria: payload.categoria,
    institucion: payload.institucion,
    estadoCiudadProcedencia: payload.estadoCiudadProcedencia,
    nombreCapitan: payload.nombreCapitan,
    correoCapitan: payload.correoCapitan,
    telefonoCapitan: payload.telefonoCapitan,
    identificacionInstitucional: payload.identificacionInstitucional ?? '',
    integrantes: JSON.stringify(integrantes),
    nombreRobot: payload.nombreRobot,
    descripcionRobot: payload.descripcionRobot,
    aceptaReglamento: String(payload.aceptaReglamento),
    aceptaUsoImagen: String(payload.aceptaUsoImagen),
    confirmaRestriccionesCategoria: String(
      payload.confirmaRestriccionesCategoria,
    ),
  };

  const formData = new FormData();
  for (const campo of CAMPOS_ESCALARES) formData.set(campo, escalares[campo]);
  for (const campo of CAMPOS_ARCHIVO) formData.set(campo, archivos[campo]);
  return formData;
}
