# Recuperación de reservas ambiguas

Procedimiento para el operador cuando un registro queda a medias. Aplica al sandbox (datos ficticios). No es un procedimiento de producción: los recursos y permisos de producción siguen sujetos a las decisiones de CROFI.

## Principios

- **Nunca** se libera una reserva ambigua de forma automática.
- **Nunca** se confirma un guardado que no se haya comprobado contando filas y archivos.
- El diagnóstico es de sólo lectura. Toda acción posterior es manual, deliberada y se registra.
- No se publican IDs de recursos, enlaces ni valores de credenciales. Se anotan sólo estado, etapa y conteos.

## Estados de la reserva

La reserva vive en la colección `sandboxRegistrationReservations` de Firestore. El documento se identifica con el SHA-256 en hexadecimal del `transactionId`.

| Estado              | Significa                                                    | Quién lo deja                          |
| ------------------- | ------------------------------------------------------------ | -------------------------------------- |
| `processing`        | Una solicitud está guardando, o el servidor cayó a la mitad  | Al empezar; se libera sola si falla sin ambigüedad |
| `completed`         | Fila y tres archivos guardados y comprobados                 | Al terminar bien                       |
| `recovery-required` | Falló de forma ambigua; puede haber fila o archivos sueltos  | El adapter, junto con la etapa y los IDs de Drive |
| `conflict`          | Respuesta al cliente; no es un estado guardado               | —                                      |

En `recovery-required` se conservan sólo referencias técnicas: `recoveryStage`, `driveFileIds` y `updatedAt`. No se guardan datos personales.

### Etapas (`recoveryStage`)

- `drive-upload-outcome-unknown`: una subida a Drive terminó con resultado incierto.
- `drive-cleanup-failed`: falló la escritura y no se pudieron borrar todos los archivos.
- `sheets-reconciliation-failed`: tras un append incierto no se pudo leer la hoja.
- `sheets-row-state-ambiguous`: hay filas repetidas o enlaces que no coinciden.
- `idempotency-reservation-state-unknown`: no se pudo actualizar la reserva.

## Precondiciones

- Sandbox propio autorizado, con `.env` local (nombres en [pruebas-sandbox-google.md](pruebas-sandbox-google.md)).
- El `transactionId` del caso. Sale del registro de la solicitud o de la columna A de `Registros`.
- Acceso de lectura a la hoja, a la carpeta de Drive y a Firestore.
- Nadie más ejecutando pruebas con ese ID.

## 1. Diagnosticar (sólo lectura)

```bash
SANDBOX_DIAGNOSTICO_ID=<transactionId> pnpm sandbox:recuperacion 2>&1 | grep -E "Diagnóstico|passed|failed"
```

Devuelve estado, etapa, antigüedad en minutos, número de filas, número de archivos y un veredicto. Registra esos conteos en el caso.

Un registro íntegro tiene **1 fila** con ese ID y **3 archivos** cuyo nombre empieza con el prefijo `copa-ollin-<id>-`.

## 2. Decidir según el veredicto

| Veredicto            | Condición                                           | Acción manual                                                                 |
| -------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------- |
| `integro`            | 1 fila, 3 archivos                                  | Ninguna.                                                                      |
| `sin-reserva`        | Sin reserva, sin fila y sin archivos                | Ninguna; el cliente puede reintentar.                                         |
| `en-proceso`         | Reserva `processing`                                | No tocar. Esperar y repetir el diagnóstico. Si pasan más de 15 minutos sin cambio, tratar como caída y escalar a Cano/Sebastián antes de actuar. |
| `completar-reserva`  | `recovery-required`, 1 fila y 3 archivos            | Verificar que los tres enlaces de la fila coinciden con los archivos; después marcar la reserva como `completed` (paso 3a). |
| `sin-rastros`        | `recovery-required`, 0 filas y 0 archivos           | Retirar la reserva (paso 3b); el cliente puede reintentar con el mismo ID.    |
| `archivos-huerfanos` | `recovery-required`, 0 filas y 1 a 3 archivos       | Borrar sólo esos archivos (paso 3c) y después retirar la reserva (paso 3b).   |
| `investigar`         | Cualquier otra combinación (filas repetidas, 1 fila con faltantes…) | No limpiar. Escalar con estado, etapa y conteos. |

Si hay duda entre dos veredictos, se elige `investigar`.

## 3. Acciones manuales

Todas se hacen en la consola de Firestore o de Drive del sandbox propio, nunca desde un script automático. Repite el diagnóstico antes y después de cada acción y anota ambos resultados.

**3a. Completar la reserva.** En el documento de la reserva, cambiar `state` a `completed`. A partir de ahí, un reintento con el mismo ID responde `DUPLICATE` con el mismo folio.

**3b. Retirar la reserva.** Borrar el documento de la reserva. Es seguro sólo si el diagnóstico acaba de dar `sin-rastros` (o tras 3c). Un reintento del cliente crea una reserva nueva.

**3c. Borrar archivos huérfanos.** En la carpeta de pruebas de Drive, buscar los archivos que empiezan con `copa-ollin-<id>-` y eliminar únicamente esos. Confirma que ninguna fila de `Registros` los enlaza.

## 4. Cuándo es seguro reintentar

- Sólo con el **mismo** `transactionId` y el mismo contenido: si queda completado se devuelve `DUPLICATE`; con contenido distinto se devuelve 409.
- Un guardado incierto **no** habilita reenviar con un ID nuevo: se duplicaría el registro.
- Reintentar es seguro cuando el diagnóstico da `integro`, `sin-reserva` o ya se ejecutó 3b.

## 5. Qué no hacer

- No borrar filas de `Registros` para "arreglar" un caso: la fila es el registro canónico.
- No borrar reservas `processing` ni `recovery-required` sin diagnóstico previo.
- No usar el mock en memoria para afirmar que se recuperó un caso real.
- No pegar IDs, enlaces ni valores de `.env` en issues, PR o capturas.
- No usar este procedimiento con datos reales de participantes.

## Registro del caso

Anota, sin IDs ni enlaces: fecha, SHA desplegado, estado y etapa, conteos antes y después, acción tomada y quién la ejecutó.

## Límites conocidos

- La antigüedad de la reserva es informativa: el umbral de 15 minutos es una recomendación operativa provisional, no un tiempo de expiración implementado.
- Las reservas creadas antes de conservar `driveFileIds` no traen esos IDs; se localizan por prefijo de nombre.
- Este diagnóstico no mide concurrencia ni cuotas; eso va en otros bloques del issue.
