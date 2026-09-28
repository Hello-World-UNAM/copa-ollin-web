import { describe, expect, it } from 'vitest';
import { categories } from '../../data/categories';
import { registroSchema } from './schema';

const[primeraCategoria]= categories;
if (!primeraCategoria) {
  throw new Error('El catálogo de categorías está vacío, no se puede ejecutar la prueba.');
}


// Todos los valores son ficticios; ninguno corresponde a una persona real.
const payloadFicticio = {
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
};

describe('registroSchema (payload de sandbox, sin archivos)', () => {
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
});
