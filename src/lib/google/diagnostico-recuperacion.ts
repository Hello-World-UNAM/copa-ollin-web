export type VeredictoRecuperacion =
  | 'sin-reserva'
  | 'integro'
  | 'sin-rastros'
  | 'archivos-huerfanos'
  | 'completar-reserva'
  | 'en-proceso'
  | 'investigar';

export interface PuertoDiagnostico {
  leerReserva(transactionId: string): Promise<{
    estado: string;
    etapa?: string;
    driveFileIds: string[];
    antiguedadMinutos?: number;
  } | null>;
  contarFilas(transactionId: string): Promise<number>;
  contarArchivos(transactionId: string): Promise<number>;
}

export interface DiagnosticoRecuperacion {
  estado: string;
  etapa?: string;
  antiguedadMinutos?: number;
  filas: number;
  archivos: number;
  archivosReferenciados: number;
  veredicto: VeredictoRecuperacion;
  accion: string;
}

export const ARCHIVOS_POR_REGISTRO = 3;

/**
 * Diagnóstico de sólo lectura. Nunca libera ni modifica reservas: sugiere la
 * acción manual que documenta el runbook.
 */
export async function diagnosticarRecuperacion(
  puerto: PuertoDiagnostico,
  transactionId: string,
): Promise<DiagnosticoRecuperacion> {
  const [reserva, filas, archivos] = await Promise.all([
    puerto.leerReserva(transactionId),
    puerto.contarFilas(transactionId),
    puerto.contarArchivos(transactionId),
  ]);

  const base = {
    filas,
    archivos,
    archivosReferenciados: reserva?.driveFileIds.length ?? 0,
    ...(reserva
      ? {
          estado: reserva.estado,
          etapa: reserva.etapa,
          antiguedadMinutos: reserva.antiguedadMinutos,
        }
      : { estado: 'sin-reserva' }),
  };

  const completo = filas === 1 && archivos === ARCHIVOS_POR_REGISTRO;
  const resultado = (
    veredicto: VeredictoRecuperacion,
    accion: string,
  ): DiagnosticoRecuperacion => ({ ...base, veredicto, accion });

  if (!reserva) {
    return completo
      ? resultado(
          'integro',
          'Hay una fila y tres archivos pero no hay reserva: documentar y no tocar.',
        )
      : resultado(
          'sin-reserva',
          'No hay reserva para este ID: no hay nada que recuperar en Firestore.',
        );
  }

  if (filas > 1) {
    return resultado(
      'investigar',
      'Hay filas repetidas con este ID: investigar manualmente; no limpiar.',
    );
  }

  if (reserva.estado === 'completed') {
    return completo
      ? resultado('integro', 'Registro íntegro: no se requiere acción.')
      : resultado(
          'investigar',
          'La reserva está completada pero los conteos no son 1 fila y 3 archivos: investigar.',
        );
  }

  if (reserva.estado === 'processing') {
    return resultado(
      'en-proceso',
      'Puede haber una solicitud en curso o una caída: no liberar; revisar antigüedad y volver a diagnosticar.',
    );
  }

  if (reserva.estado === 'recovery-required') {
    if (completo) {
      return resultado(
        'completar-reserva',
        'Fila y tres archivos comprobados: la reserva puede marcarse como completada siguiendo el runbook.',
      );
    }
    if (filas === 0 && archivos === 0) {
      return resultado(
        'sin-rastros',
        'Sin fila ni archivos: es seguro retirar la reserva siguiendo el runbook y reintentar.',
      );
    }
    if (filas === 0) {
      return resultado(
        'archivos-huerfanos',
        'Archivos sin fila: eliminar sólo esos archivos y después retirar la reserva, según el runbook.',
      );
    }
  }

  return resultado(
    'investigar',
    'Combinación no prevista: investigar manualmente; no limpiar ni liberar.',
  );
}
