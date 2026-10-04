import { describe, expect, it } from 'vitest';
import { categories } from '../../data/categories';
import { registroSchema } from './schema';

const [primeraCategoria] = categories;
if (!primeraCategoria) {
  throw new Error(
    'El catálogo de categorías está vacío, no se puede ejecutar la prueba.',
  );
}

const bytesPdfFicticio = new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52, 10]);
const crearPdfFicticio = (nombre: string, bytes = bytesPdfFicticio) =>
  new File([bytes], nombre, { type: 'application/pdf' });

// Todos los valores son ficticios; ninguno corresponde a una persona real.
const payloadFicticio = {
  transactionId: '00000000-0000-4000-8000-000000000010',
  nombreEquipo: 'Equipo Prueba 01',
  categoria: primeraCategoria.slug,
  institucion: 'Facultad Ficticia de Ingeniería',
  estadoCiudadProcedencia: 'Ciudad de México (dato ficticio)',
  nombreCapitan: 'Nombre Ficticio Apellido',
  correoCapitan: 'equipo-prueba-0001@example.invalid',
  telefonoCapitan: '5555555555',
  identificacionInstitucional: '',
  integrantes: [{ nombre: 'Integrante Ficticio Uno', correo: '' }],
  nombreRobot: 'Robot Ficticio',
  descripcionRobot: 'Descripción ficticia y breve del robot de prueba.',
  aceptaReglamento: true,
  aceptaUsoImagen: true,
  confirmaRestriccionesCategoria: true,
  archivoIdentificacion: crearPdfFicticio('identificacion-ficticia.pdf'),
  comprobantePago: crearPdfFicticio('comprobante-ficticio.pdf'),
  cartaResponsiva: crearPdfFicticio('carta-ficticia.pdf'),
};

describe('registroSchema (payload ficticio de sandbox)', () => {
  it('acepta un payload ficticio completo', () => {
    expect(registroSchema.safeParse(payloadFicticio).success).toBe(true);
  });

  it('rechaza un correo de capitán inválido', () => {
    const result = registroSchema.safeParse({
      ...payloadFicticio,
      correoCapitan: 'no-es-un-correo',
    });
    expect(result.success).toBe(false);
  });

  it('exige al menos un integrante', () => {
    const result = registroSchema.safeParse({
      ...payloadFicticio,
      integrantes: [],
    });
    expect(result.success).toBe(false);
  });

  it('rechaza una descripción de robot mayor a 300 palabras', () => {
    const result = registroSchema.safeParse({
      ...payloadFicticio,
      descripcionRobot: Array(301).fill('palabra').join(' '),
    });
    expect(result.success).toBe(false);
  });

  it('exige las tres confirmaciones antes de aceptar el payload', () => {
    const result = registroSchema.safeParse({
      ...payloadFicticio,
      aceptaReglamento: false,
    });
    expect(result.success).toBe(false);
  });

  it('rechaza una categoría fuera del catálogo vigente', () => {
    const result = registroSchema.safeParse({
      ...payloadFicticio,
      categoria: 'categoria-inexistente',
    });
    expect(result.success).toBe(false);
  });

  it('rechaza un transactionId que no sea UUID', () => {
    const result = registroSchema.safeParse({
      ...payloadFicticio,
      transactionId: 'no-es-un-uuid',
    });

    expect(result.success).toBe(false);
  });

  it('rechaza si falta uno de los tres PDF', () => {
    const payloadSinCarta: Partial<typeof payloadFicticio> = {
      ...payloadFicticio,
    };
    delete payloadSinCarta.cartaResponsiva;

    expect(registroSchema.safeParse(payloadSinCarta).success).toBe(false);
  });

  it('rechaza un archivo que no declara MIME PDF', () => {
    const result = registroSchema.safeParse({
      ...payloadFicticio,
      comprobantePago: new File(['contenido ficticio'], 'texto.txt', {
        type: 'text/plain',
      }),
    });

    expect(result.success).toBe(false);
  });

  it('rechaza PDFs mayores a 1 MiB', () => {
    const bytesGrandes = new Uint8Array(1024 * 1024 + 1);
    bytesGrandes.set(bytesPdfFicticio);
    const result = registroSchema.safeParse({
      ...payloadFicticio,
      archivoIdentificacion: crearPdfFicticio(
        'identificacion-grande-ficticia.pdf',
        bytesGrandes,
      ),
    });

    expect(result.success).toBe(false);
  });

  it('acepta tres PDFs de 1 MiB, el límite total de sandbox', () => {
    const bytesDeUnMiB = new Uint8Array(1024 * 1024);
    bytesDeUnMiB.set(bytesPdfFicticio);
    const result = registroSchema.safeParse({
      ...payloadFicticio,
      archivoIdentificacion: crearPdfFicticio(
        'identificacion-ficticia.pdf',
        bytesDeUnMiB,
      ),
      comprobantePago: crearPdfFicticio(
        'comprobante-ficticio.pdf',
        bytesDeUnMiB,
      ),
      cartaResponsiva: crearPdfFicticio('carta-ficticia.pdf', bytesDeUnMiB),
    });

    expect(result.success).toBe(true);
  });
});
