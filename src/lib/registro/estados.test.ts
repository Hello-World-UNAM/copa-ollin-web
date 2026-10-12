import { describe, expect, it } from 'vitest';
import { buscarEstado } from './estados';

describe('buscarEstado', () => {
  it('ignora acentos, mayúsculas y espacios', () => {
    expect(buscarEstado('queretaro')).toBe('Querétaro');
    expect(buscarEstado('  MICHOACAN ')).toBe('Michoacán');
    expect(buscarEstado('Atlantis')).toBeUndefined();
  });
});
