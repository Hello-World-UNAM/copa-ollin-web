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
- Paso manual autorizado: escribir el encabezado `folio` en `S1` de la hoja sandbox. No sobrescribir A1:R1 ni filas existentes.
- Riesgo abierto: la configuración exige `Registros!A:R` y el preflight lee `A1:R1`. Debe comprobarse en el sandbox autorizado que `append` escribe también la columna S con ese rango; si no, se propondrá a coordinación ampliar a `A:S` (cambio compartido).

## Vista derivada

Transformación en [`vista-operativa.ts`](../../src/lib/google/vista-operativa.ts): encabezados claros, folio primero, categoría con nombre, integrantes uno por línea, Sí/No en confirmaciones y enlaces de documentos identificables. Se recomienda crear en la hoja una pestaña aparte (por ejemplo `Vista CROFI`) con filtro activado en la fila de encabezados.

Pruebas: [`vista-operativa.test.ts`](../../src/lib/google/vista-operativa.test.ts) (ceros iniciales, integrantes legibles, folio derivado/persistido, fila canónica intacta, JSON ilegible).

## Reversión

1. Eliminar la pestaña derivada. La pestaña `Registros` no cambió.
2. Si se añadió `folio` en `S1`, borrar sólo esa celda; el código ignora la columna ausente al leer (el servidor deriva el folio igualmente).

## Pendiente

- Procedimiento/script de aplicación sobre una hoja real: requiere sandbox autorizado y aprobación; hasta entonces sólo existe la transformación.
- Captura ficticia de la vista: se toma al aplicar en el sandbox.
