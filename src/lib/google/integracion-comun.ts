import { createFakeRegistrationData } from './mock';

// Utilidades de las pruebas de integración opt-in contra el sandbox propio.
export function crearPdfFicticio(): Uint8Array {
  const content = 'BT /F1 12 Tf 72 720 Td (Fictitious sandbox test) Tj ET\n';
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n',
    `4 0 obj\n<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}endstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];
  let document = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(document));
    document += object;
  }
  const xref = Buffer.byteLength(document);
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  document += offsets
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('');
  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Uint8Array(Buffer.from(document));
}

export function crearRegistroFicticio(
  transactionId: string,
  sobrescribir: Partial<ReturnType<typeof createFakeRegistrationData>> = {},
) {
  const pdf = crearPdfFicticio();
  const crearArchivo = (nombre: string) => {
    const buffer = new ArrayBuffer(pdf.byteLength);
    new Uint8Array(buffer).set(pdf);
    return new File([buffer], nombre, { type: 'application/pdf' });
  };
  return createFakeRegistrationData(transactionId, {
    archivoIdentificacion: crearArchivo('identificacion-ficticia.pdf'),
    comprobantePago: crearArchivo('comprobante-ficticio.pdf'),
    cartaResponsiva: crearArchivo('carta-ficticia.pdf'),
    ...sobrescribir,
  });
}

export function crearFormData(
  registro: ReturnType<typeof createFakeRegistrationData>,
): FormData {
  const formData = new FormData();
  formData.set('transactionId', registro.transactionId);
  formData.set('nombreEquipo', registro.nombreEquipo);
  formData.set('categoria', registro.categoria);
  formData.set('institucion', registro.institucion);
  formData.set('estadoCiudadProcedencia', registro.estadoCiudadProcedencia);
  formData.set('nombreCapitan', registro.nombreCapitan);
  formData.set('correoCapitan', registro.correoCapitan);
  formData.set('telefonoCapitan', registro.telefonoCapitan);
  formData.set(
    'identificacionInstitucional',
    registro.identificacionInstitucional ?? '',
  );
  formData.set('integrantes', JSON.stringify(registro.integrantes));
  formData.set('nombreRobot', registro.nombreRobot);
  formData.set('descripcionRobot', registro.descripcionRobot);
  formData.set('aceptaReglamento', String(registro.aceptaReglamento));
  formData.set('aceptaUsoImagen', String(registro.aceptaUsoImagen));
  formData.set(
    'confirmaRestriccionesCategoria',
    String(registro.confirmaRestriccionesCategoria),
  );
  formData.set('archivoIdentificacion', registro.archivoIdentificacion);
  formData.set('comprobantePago', registro.comprobantePago);
  formData.set('cartaResponsiva', registro.cartaResponsiva);
  return formData;
}
