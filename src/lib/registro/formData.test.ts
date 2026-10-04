import { describe, expect, it } from 'vitest';
import { CAMPOS_ARCHIVO, CAMPOS_ESCALARES } from './contract';
import { archivosFicticios, payloadFicticio } from './fixtures';
import { construirFormData } from './formData';

describe('construirFormData', () => {
  const formData = construirFormData(
    payloadFicticio,
    archivosFicticios(),
    'reg-test-001',
  );

  it('envía exactamente los campos del contrato, cada uno una vez', () => {
    const claves = [...formData.keys()].sort();
    expect(claves).toEqual([...CAMPOS_ESCALARES, ...CAMPOS_ARCHIVO].sort());
  });

  it('serializa booleanos como "true"/"false" y conserva el transactionId', () => {
    expect(formData.get('aceptaReglamento')).toBe('true');
    expect(formData.get('transactionId')).toBe('reg-test-001');
  });

  it('omite el correo vacío de los integrantes', () => {
    const integrantes = JSON.parse(String(formData.get('integrantes')));
    expect(integrantes).toEqual([
      { nombre: 'Integrante Ficticio Uno' },
      { nombre: 'Integrante Ficticio Dos', correo: 'dos@example.invalid' },
    ]);
  });

  it('adjunta los PDF con su nombre de archivo', () => {
    const comprobante = formData.get('comprobantePago');
    expect(comprobante).toBeInstanceOf(File);
    expect((comprobante as File).name).toBe('comprobante.pdf');
  });
});