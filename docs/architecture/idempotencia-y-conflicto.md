# Idempotencia por huella y conflicto 409

Refs #30. Implementa el acuerdo de [contrato-sprint04.md](./contrato-sprint04.md).

## Comportamiento

| Mismo `transactionId` | Resultado |
| --- | --- |
| Primera solicitud | 200 `SAVED`, con folio |
| Mismos datos y mismos bytes de documentos | 200 `DUPLICATE`, mismo folio, sin filas ni archivos nuevos |
| Datos o bytes distintos | 409 `IDEMPOTENCY_CONFLICT`, sin folio y sin escrituras |

## Huella

[`huella.ts`](../../src/lib/google/huella.ts) calcula un SHA-256 sobre los campos normalizados y, por cada documento, tipo, tamaño y SHA-256 de sus bytes. Los nombres de archivo no cuentan. La huella se guarda en la reserva de Firestore al crearla; no contiene datos legibles.

## Límites conocidos

- Reservas creadas antes de este cambio no tienen huella: no se pueden comparar y se tratan como antes (sin 409). Sólo afecta al sandbox.
- Si una solicitud con otra huella llega mientras la original sigue en `processing`, también recibe 409.
- La lógica de huella en Firestore sólo se probó con stores simulados; falta ejecutarla contra el sandbox autorizado (concurrencia real, con conteo de filas y archivos).
- Un 409 no libera ni modifica la reserva existente.
