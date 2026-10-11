import { describe, expect, it } from 'vitest';
import { categories } from '../../data/categories';
import { registroSchema } from './schema';
import { registerSchema } from '../schemas/register';

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
  estadoCiudadProcedencia: 'Ciudad de México',
  nombreCapitan: 'Nombre Apellido',
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

describe('registroSchema (payload)', () => {
  it('acepta un payload', () => {
    expect(registroSchema.safeParse(payloadFicticio).success).toBe(true);
  });
  it('teléfono: rechaza letras y símbolos, y conserva ceros iniciales', () => {
    for (const telefono of ['abc', '55 5555 5555', '55-5555', '+525555']) {
      expect(
        registroSchema.safeParse({
          ...payloadFicticio,
          telefonoCapitan: telefono,
        }).success,
      ).toBe(false);
    }
    const valido = registroSchema.safeParse({
      ...payloadFicticio,
      telefonoCapitan: '0012345678',
    });
    expect(valido.success && valido.data.telefonoCapitan).toBe('0012345678');
  });

  it('correo de integrante: vacío válido, omitido válido e inválido con error anidado', () => {
    const base = { ...payloadFicticio };
    expect(
      registroSchema.safeParse({
        ...base,
        integrantes: [{ nombre: 'A', correo: '' }],
      }).success,
    ).toBe(true);
    expect(
      registroSchema.safeParse({ ...base, integrantes: [{ nombre: 'A' }] })
        .success,
    ).toBe(true);
    const invalido = registroSchema.safeParse({
      ...base,
      integrantes: [{ nombre: 'A', correo: 'no-es-correo' }],
    });
    expect(invalido.success).toBe(false);
    if (!invalido.success) {
      expect(invalido.error.issues[0]?.path).toEqual([
        'integrantes',
        0,
        'correo',
      ]);
      expect(invalido.error.issues[0]?.message).toBe(
        'Escribe un correo válido',
      );
    }
    expect(
      registroSchema.safeParse({
        ...base,
        integrantes: [{ nombre: 'A', correo: 'ok@example.invalid' }],
      }).success,
    ).toBe(true);
  });

  it('descripción de exactamente 300 palabras es válida y de 301 no', () => {
    const palabras = (n: number) => Array(n).fill('palabra').join(' ');
    expect(
      registroSchema.safeParse({
        ...payloadFicticio,
        descripcionRobot: palabras(300),
      }).success,
    ).toBe(true);
    expect(
      registroSchema.safeParse({
        ...payloadFicticio,
        descripcionRobot: palabras(301),
      }).success,
    ).toBe(false);
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

  it('el servidor rechaza un transactionId con caracteres no permitidos', async () => {
    const result = await registerSchema.safeParseAsync({
      ...payloadFicticio,
      integrantes: [{ nombre: 'Integrante Ficticio Uno' }],
      transactionId: 'id con espacios',
    });

    expect(result.success).toBe(false);
  });

  it('el servidor rechaza si falta uno de los tres PDF', async () => {
    const payloadSinCarta: Partial<typeof payloadFicticio> = {
      ...payloadFicticio,
    };
    delete payloadSinCarta.cartaResponsiva;

    expect((await registerSchema.safeParseAsync(payloadSinCarta)).success).toBe(
      false,
    );
  });

  it('el servidor rechaza un archivo que no declara MIME PDF', async () => {
    const result = await registerSchema.safeParseAsync({
      ...payloadFicticio,
      comprobantePago: new File(['contenido ficticio'], 'texto.txt', {
        type: 'text/plain',
      }),
    });

    expect(result.success).toBe(false);
  });

  it('el servidor rechaza PDFs mayores a 1 MiB', async () => {
    const bytesGrandes = new Uint8Array(1024 * 1024 + 1);
    bytesGrandes.set(bytesPdfFicticio);
    const result = await registerSchema.safeParseAsync({
      ...payloadFicticio,
      archivoIdentificacion: crearPdfFicticio(
        'identificacion-grande-ficticia.pdf',
        bytesGrandes,
      ),
    });

    expect(result.success).toBe(false);
  });

  it('el servidor acepta tres PDFs de 1 MiB, el límite total de sandbox', async () => {
    const bytesDeUnMiB = new Uint8Array(1024 * 1024);
    bytesDeUnMiB.set(bytesPdfFicticio);
    const result = await registerSchema.safeParseAsync({
      ...payloadFicticio,
      integrantes: [{ nombre: 'Integrante Ficticio Uno' }],
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
  it('teléfono: exactamente 10 dígitos', () => {
    for (const t of ['123456789', '12345678901'])
      expect(
        registroSchema.safeParse({ ...payloadFicticio, telefonoCapitan: t })
          .success,
      ).toBe(false);
    expect(
      registroSchema.safeParse({
        ...payloadFicticio,
        telefonoCapitan: '0012345678',
      }).success,
    ).toBe(true);
  });
});
