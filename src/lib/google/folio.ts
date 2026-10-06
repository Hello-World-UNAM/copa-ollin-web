import { createHash } from 'node:crypto';

// Sin 0/O/1/I/L para evitar confusiones al dictarlo o copiarlo (31 símbolos).
const ALFABETO = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const LONGITUD = 8;

export const PATRON_FOLIO = /^CO-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/;

/**
 * Folio opaco y estable derivado del transactionId: el mismo registro o
 * reintento produce siempre el mismo folio, sin contador ni coordinación.
 * No es un secreto, validación de pago ni aceptación de inscripción.
 */
export function generarFolio(transactionId: string): string {
  const digest = createHash('sha256')
    .update(`copa-ollin:folio:${transactionId}`)
    .digest();
  let caracteres = '';
  for (let i = 0; i < LONGITUD; i++) {
    // Módulo 31 sobre un byte: sesgo leve, irrelevante para un identificador no secreto.
    caracteres += ALFABETO[digest[i]! % ALFABETO.length];
  }
  return `CO-${caracteres.slice(0, 4)}-${caracteres.slice(4)}`;
}
