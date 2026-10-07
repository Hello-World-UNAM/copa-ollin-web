# Timeouts, reintentos y consumo de Google

Aplica al adapter real del sandbox ([real.ts](../../src/lib/google/real.ts)). La política vive en [politica-llamadas.ts](../../src/lib/google/politica-llamadas.ts).

## Política por operación

| Llamada                     | Tiempo máximo | Reintentos | Motivo                                                        |
| --------------------------- | ------------- | ---------- | ------------------------------------------------------------- |
| Sheets `values.get`         | 10 s          | hasta 2    | Lectura: repetirla no cambia nada.                            |
| Drive `files.delete`        | 10 s          | hasta 2    | Borrar es repetible; la limpieza ya trata el fallo como recuperación. |
| Drive `files.create`        | 20 s          | **0**      | Un timeout deja el archivo en estado incierto.                |
| Sheets `values.append`      | 10 s          | **0**      | Un timeout deja la fila en estado incierto.                   |

- Retroceso exponencial: 300 ms y 600 ms entre reintentos.
- Sólo se reintenta ante timeout, 429, motivos de cuota, 500/502/503/504 y errores de red (`ECONNRESET`, `ETIMEDOUT`, `EAI_AGAIN`, `ECONNREFUSED`). Los errores 400/401/403/404 no se reintentan.
- Un timeout en una **escritura** no se repite: se resuelve con la reconciliación existente (lectura de la hoja, limpieza y, si es ambiguo, reserva `recovery-required`). Ver [recuperacion-de-reservas.md](recuperacion-de-reservas.md).
- El timeout deja de esperar la respuesta, pero no cancela la petición ya enviada: por eso la escritura nunca se da por fallida sin comprobarlo.
- Los valores son constantes con valores por defecto, inyectables en pruebas. No se añadieron variables de entorno.

## Errores y cuota

- Una cuota agotada (429 o motivos `rateLimitExceeded`, `userRateLimitExceeded`, `quotaExceeded`, `dailyLimitExceeded`) se trata como fallo temporal: la API responde 502 `temporal` y se cuenta en las métricas con el resultado `cuota`.
- No se añadió ningún código HTTP nuevo ni cambio de contrato.

## Medición de consumo

`obtenerMetricasGoogle()` devuelve contadores `servicio.operación.resultado` (`ok`, `error`, `timeout`, `cuota`, `reintento`). Son contadores en memoria por instancia, sin IDs ni datos personales. No hay un panel ni un endpoint que los exponga.

### Llamadas por registro nuevo (derivado del código, no medido)

| Servicio  | Llamadas                                                         |
| --------- | ---------------------------------------------------------------- |
| Sheets    | 1 lectura (`values.get`) + 1 escritura (`values.append`)         |
| Drive     | 3 subidas (`files.create`)                                       |
| Firestore | 1 transacción de reserva + 1 escritura al completar              |

Con la meta de 100 envíos simultáneos: unas 100 lecturas y 100 escrituras de Sheets, 300 subidas de Drive y 200 operaciones de Firestore. Un fallo añade lecturas de reconciliación y borrados. Los límites reales de cuota de cada API deben comprobarse en la consola del proyecto de pruebas; este documento no los afirma.

## Qué no cubre

- No hay medición real bajo carga: la concurrencia y las cuotas siguen pendientes (bloque F).
- La protección contra abuso (límite de solicitudes) no está implementada; requiere coordinar un código 429 con Cano y Sebastián.
- Las pruebas usan clientes simulados; no demuestran el comportamiento de Google.
