## Contrato cliente–servidor del sandbox (Sprint 3)

Fuente única: `src/lib/registro/contract.ts`. Cliente, handler y esquema del servidor importan de ahí.

| Elemento | Valor provisional | Estado |
|---|---|---|
| PDF por archivo / total | 1 MiB / 3 MiB (cliente y servidor) | Sólo sandbox; no es requisito de CROFI (P0-06) |
| Formato aceptado | PDF (MIME + firma `%PDF-`) | Sandbox |
| Reintento | `transactionId` estable hasta confirmar o reiniciar | Semántica productiva pendiente (P2-02) |

Diferencias deliberadas (no inventar reglas):
- Las tres confirmaciones deben ser `true` en el cliente; el servidor sólo exige booleanos hasta resolver P1-08.
- El cliente exige teléfono ≥ 10 caracteres, ≥ 1 integrante y descripción no vacía; el servidor aún no (P1-03/P1-05).
- `categoria` viaja como slug; el servidor sólo exige texto no vacío.

Respuestas HTTP: 200 `SAVED`/`DUPLICATE`, 400 `VALIDATION_ERROR` (u otros códigos de solicitud), 413 (tamaño), 502 `TEMPORARY_STORAGE_ERROR`/`RECOVERY_REQUIRED`, 503 (deshabilitado/sin configurar).