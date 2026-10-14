# Vista operativa de Sheets y columna de folio

Estado: transformación implementada y probada con datos ficticios; **aplicación a una hoja real pendiente de autorización**. Refs: Sprint 4 · persistencia íntegra y operación del registro.

## Principios

- `Registros` sigue siendo el registro canónico. Esta vista **no la modifica**: sólo lee y deriva.
- Los valores se siguen escribiendo en modo `RAW` (texto); el teléfono conserva ceros iniciales.
- No se destruye el JSON de integrantes ni la fila técnica.
- No hay datos reales en pruebas ni en este documento.

## Columna de folio (migración compatible)

| Columna | Encabezado | Origen |
| --- | --- | --- |
| A–R | Sin cambios (18 existentes) | Contrato actual |
| S | `folio` | `generarFolio(transactionId)` en [`folio.ts`](../../src/lib/google/folio.ts) |

- Formato `CO-XXXX-XXXX`, alfabeto sin `0/O/1/I/L`; es opaco, estable por reintento y **no** valida pago ni inscripción.
- Las filas anteriores no necesitan relleno: la vista calcula su folio con la misma función.
- Paso manual autorizado: escribir el encabezado `Folio` en `S1` de la hoja sandbox. No sobrescribir filas existentes. Los encabezados legibles de `Registros` (`ENCABEZADOS_REGISTROS` en `vista-operativa.ts`) son un cambio manual de la fila 1; el orden de columnas no cambia y los nombres técnicos originales siguen aceptados por el preflight.
- Riesgo abierto: la configuración exige `Registros!A:R` y el preflight lee `A1:R1`. Debe comprobarse en el sandbox autorizado que `append` escribe también la columna S con ese rango; si no, se propondrá a coordinación ampliar a `A:S` (cambio compartido).

## Aviso "guarda tu folio" (entrega al formulario)

El servidor añade `avisoFolio` junto a `folio` en las respuestas 200 `SAVED` y `DUPLICATE` (campo aditivo; clientes anteriores lo ignoran). Texto: ver `AVISO_FOLIO` en [`handler.ts`](../../src/lib/registration/handler.ts). **Mostrarlo y ofrecer copiar el folio corresponde al formulario (otro owner)**; hoy [`envio.ts`](../../src/lib/registro/envio.ts) no lo lee. El folio no valida pago ni inscripción.

## Vista derivada

Transformación en [`vista-operativa.ts`](../../src/lib/google/vista-operativa.ts): encabezados claros, folio primero, categoría con nombre, integrantes uno por línea, Sí/No en confirmaciones y enlaces de documentos identificables. Se recomienda crear en la hoja una pestaña aparte (por ejemplo `Vista CROFI`) con filtro activado en la fila de encabezados.

Pruebas: [`vista-operativa.test.ts`](../../src/lib/google/vista-operativa.test.ts) (ceros iniciales, integrantes legibles, folio derivado/persistido, fila canónica intacta, JSON ilegible).

## Aplicar la vista en una hoja autorizada

[`vista-operativa-aplicar.ts`](../../src/lib/google/vista-operativa-aplicar.ts) recibe un puerto de Sheets inyectado (probado sin Google en [`vista-operativa-aplicar.test.ts`](../../src/lib/google/vista-operativa-aplicar.test.ts)).

- Por defecto **sólo planifica** (lecturas): informa filas, columnas, si falta `folio` en `S1` y si falta la pestaña.
- Con `confirmar: true` crea o limpia la pestaña `Vista CROFI`, escribe encabezados y filas, congela la fila 1 y activa el filtro. La pestaña es derivada: no se edita a mano, se regenera.
- En `Registros` sólo escribe `S1` (`folio`) y únicamente si está vacía.
- Aún no existe un comando que conecte este módulo con OAuth: falta un runner para el sandbox propio, con autorización explícita.

## Reversión

1. Eliminar la pestaña derivada. La pestaña `Registros` no cambió.
2. Si se añadió `folio` en `S1`, borrar sólo esa celda; el código ignora la columna ausente al leer (el servidor deriva el folio igualmente).

## Pendiente

- Runner con OAuth para ejecutar la aplicación en el sandbox propio y captura ficticia del resultado; hasta entonces sólo existen la transformación y el módulo probado con puerto simulado.
- Captura ficticia de la vista: se toma al aplicar en el sandbox.

## Aplicar la vista en un sandbox propio autorizado

Sólo con hoja de pruebas ficticia y credenciales locales (`.env` ignorado por Git, variables `SANDBOX_GOOGLE_*`). Nunca en CI ni sobre la hoja real.

1. **Plan, sin escribir** (por defecto):

   ```bash
   pnpm sandbox:vista
   ```

   Imprime sólo cantidades y banderas (pestaña por crear, filas, encabezado de folio), sin IDs ni datos.

2. **Aplicar** (crea la pestaña `Vista CROFI` y escribe `Registros!S1` sólo si estaba vacío):

   ```bash
   SANDBOX_VISTA_CONFIRMAR=true pnpm sandbox:vista
   ```

3. **Reversión**: borrar la pestaña `Vista CROFI` y, si el plan indicó `escribirEncabezadoFolio`, vaciar `Registros!S1`. La pestaña `Registros` y su JSON técnico no se modifican.

Los valores se escriben en `RAW` para conservar ceros iniciales. Esta prueba no sustituye la verificación posterior en el staging compartido.
