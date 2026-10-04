import type { RegistroPayload } from './schema';

export function crearRegistroFormData(payload: RegistroPayload): FormData {
  const formData = new FormData();
  formData.set('transactionId', payload.transactionId);
  formData.set('nombreEquipo', payload.nombreEquipo);
  formData.set('categoria', payload.categoria);
  formData.set('institucion', payload.institucion);
  formData.set('estadoCiudadProcedencia', payload.estadoCiudadProcedencia);
  formData.set('nombreCapitan', payload.nombreCapitan);
  formData.set('correoCapitan', payload.correoCapitan);
  formData.set('telefonoCapitan', payload.telefonoCapitan);
  formData.set(
    'identificacionInstitucional',
    payload.identificacionInstitucional ?? '',
  );
  formData.set('integrantes', JSON.stringify(payload.integrantes));
  formData.set('nombreRobot', payload.nombreRobot);
  formData.set('descripcionRobot', payload.descripcionRobot);
  formData.set('aceptaReglamento', String(payload.aceptaReglamento));
  formData.set('aceptaUsoImagen', String(payload.aceptaUsoImagen));
  formData.set(
    'confirmaRestriccionesCategoria',
    String(payload.confirmaRestriccionesCategoria),
  );
  formData.set('archivoIdentificacion', payload.archivoIdentificacion);
  formData.set('comprobantePago', payload.comprobantePago);
  formData.set('cartaResponsiva', payload.cartaResponsiva);

  return formData;
}
