# Contrato de coordinación · Sprint 4

Acuerdo técnico de preparación solicitado por Sebastián, 4 de octubre de 2026. No cambia requisitos oficiales, no habilita registro público y no afirma que las extensiones ya estén implementadas. Fuentes: [kit](../requirements/kit-de-inicio.md), [preguntas abiertas](../requirements/preguntas-abiertas.md) y contrato actual `src/lib/registro/contract.ts`.

## Base y extensiones

Endpoint mismo origen `POST /api/register`, multipart. Conservar los 15 campos escalares de `CAMPOS_ESCALARES` y los tres archivos de `CAMPOS_ARCHIVO`, sin campos duplicados/desconocidos. `integrantes` es JSON; confirmaciones se serializan como `true`/`false`. No establecer manualmente Content-Type: fetch genera el boundary.

| Aspecto                      | Acuerdo objetivo                                                                                                                          | Estado actual / responsable                                                                                                                                             |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Folio                        | HTTP 200 SAVED/DUPLICATE añade `folio` string no vacío; opaco para cliente, legible/único/persistido por servidor y estable al reintentar | No implementado; Paty genera, Alejandro muestra/copia                                                                                                                   |
| transactionId                | Conservar patrón `[A-Za-z0-9_-]{1,80}` y significado técnico; no reemplazar por folio                                                     | Actual; propietario de sesión cliente Alejandro, reserva servidor Paty                                                                                                  |
| Idempotencia                 | Mismo ID y datos/bytes equivalentes → DUPLICATE con mismo folio; contenido distinto → HTTP 409 `IDEMPOTENCY_CONFLICT`, nunca éxito falso  | Conflicto/huella objetivo de Paty; Alejandro conserva datos y muestra conflicto sin reintento ciego                                                                     |
| Teléfono                     | String de dígitos ASCII, requerido, conservar ceros iniciales; no longitud/país oficial inventados                                        | Schemas actuales difieren; Alejandro/Paty alinean sus capas                                                                                                             |
| Correo opcional integrante   | Omitir `correo` cuando esté vacío en multipart; si se informa debe ser válido y tener error anidado visible                               | Backend actual rechaza `correo: ""`; cliente normaliza omisión, ambos validan                                                                                           |
| Campos obligatorios          | Textos del kit no vacíos tras trim; catálogo de slugs vigente; descripción requerida hasta 300 palabras                                   | Sin inventar mínimo de dos caracteres para equipo; corregir diferencias de schemas en cada capa                                                                         |
| Integrantes                  | Lista no vacía con nombres; cantidad se obtiene de la lista, sin añadir campo al multipart                                                | No es límite oficial de personas/equipos ni determina si capitán cuenta; consultar pendientes CROFI                                                                     |
| Identificación institucional | Número opcional como texto, omitido o vacío; distinto del archivo obligatorio                                                             | Mantener opcionalidad, no inventar patrón institucional                                                                                                                 |
| Confirmaciones               | Conservar los tres booleanos existentes y nombres; fixture feliz usa true                                                                 | Firmante, menores y carácter obligatorio de uso de imagen siguen pendientes. No elevar true del fixture a regla jurídica; cambios de política requieren respuesta CROFI |

Comparar huella de datos normalizados y bytes/tipos de archivos, no sólo nombres o límites: especificación/implementación durable de Paty. No prometer que un payload cambiado bajo un ID ambiguo pueda reenviarse con ID nuevo sin reconciliación: podría duplicar inscripción. Retroceder antes del primer envío puede editar datos; después de resultado incierto conservar payload/ID para investigar.

## Formatos y límites fijados para esta entrega

| Campo                   | MIME admitidos objetivo                      | Extensiones                    |
| ----------------------- | -------------------------------------------- | ------------------------------ |
| `archivoIdentificacion` | `application/pdf`                            | `.pdf`                         |
| `comprobantePago`       | `application/pdf`, `image/jpeg`, `image/png` | `.pdf`, `.jpg`/`.jpeg`, `.png` |
| `cartaResponsiva`       | `application/pdf`                            | `.pdf`                         |

Selección técnica inicial: el kit explicita PDF o imagen para comprobante; no exige formatos adicionales para los otros documentos. No afirmar que CROFI prohibió imágenes de identificación/responsiva. Si los necesita, coordinación amplía este inventario antes de implementar; no negociar listas distintas entre cliente/servidor. SVG, HEIC, GIF, WebP y ejecutables no se aceptan en esta versión: indicar cómo exportar a un formato permitido, especialmente en iOS. Un comprobante JPG no demuestra pago válido; una responsiva PDF no demuestra firma jurídicamente válida.

Mantener 1 MiB (1 048 576 bytes) por archivo y 3 MiB en total; límite multipart actual 3 MiB + 64 KiB. Son límites provisionales técnicos, no reglas CROFI. Validar MIME declarado y firma/contenido decodificable, rechazar vacío/disfrazado/excesivo; extensión de Drive coherente. No aceptar SVG activo ni fiarse sólo de extensión. No incorporar conversión/arquitectura nueva de cargas grandes sin acuerdo. Backend/cliente actuales continúan PDF-only hasta sus issues.

## Respuestas y fixtures

Conservar `code`, `message`/`error`, `isDuplicate` y `details[{field,message}]`; paths anidados como `integrantes.0.correo` se muestran junto al control. No filtrar proveedor, credenciales ni IDs de Google. Objetivo de errores: 400 VALIDATION_ERROR/INVALID_MULTIPART/UNEXPECTED_FIELD/REPEATED_FIELD; 401 SANDBOX_UNAUTHORIZED; 409 IDEMPOTENCY_CONFLICT; 413 PAYLOAD_TOO_LARGE; 502 TEMPORARY_STORAGE_ERROR/RECOVERY_REQUIRED; 503 SANDBOX_DISABLED/SANDBOX_AUTH_NOT_CONFIGURED/SANDBOX_CONFIGURATION_ERROR; 500 INTERNAL_ERROR. Red caída no tiene HTTP: rechazo de fetch. Sólo 200 SAVED/DUPLICATE cuenta como guardado; nunca aceptación/pago validado.

El contrato actual no devuelve folio ni 409. Cliente debe tolerar respuesta antigua sin inventar folio; frontend/backend entregan cambios compatibles. Las respuestas nuevas en `tests/fixtures/sprint04/registro.ts` son simuladas, no evidencia Google. No importar ese módulo Node en el bundle cliente: Playwright/Vitest consumen las respuestas y las inyectan en transportes de prueba. Pruebas de Google real quedan fuera de CI y del paquete.

Archivos en `tests/fixtures/sprint04/`: tres PDF etiquetados ficticios, comprobante PNG/JPEG y SVG fuente de generación (SVG no es upload permitido). `crearMultipartSprint04()` construye request PDF compatible con el handler actual; argumento png/jpeg prueba extensión futura, no funciona aún en backend actual. Folio ficticio `PRUEBA-FOLIO-0001` no define formato oficial.

## Comandos disponibles y seguridad

```bash
pnpm test:contrato:sprint04
pnpm dev:sandbox:mock --print-config
pnpm dev:sandbox:mock
```

Primer comando comprueba fixtures/serialización y compatibilidad PDF con handler+adapter sólo mock; no prueba cumplimiento de folio/imágenes/conflicto en runtime. El segundo muestra exclusivamente configuración ficticia. El tercero levanta Astro en loopback `127.0.0.1:4337`, formulario habilitado, Google real apagado y token fijo explícitamente ficticio sólo de servidor. Quita variables personales Google/Firestore del proceso. Antes de levantarlo, detener otro Astro de este mismo repositorio (incluido servidor Google local); no usarlo para staging ni exponerlo a la red. `.env` personal no se versiona y no es requisito para este modo.

```bash
pnpm format:check
pnpm lint
NODE_OPTIONS=--max-old-space-size=4096 pnpm check
pnpm test
pnpm build
pnpm exec playwright install chromium firefox
pnpm test:e2e
```

E2E existente inicia su propio Astro mock; detener previamente dev. No se afirma que la suite actual cubra todas las funciones nuevas. Cada owner añade pruebas propias. Android/iOS físicos y QA protegido de staging son comprobaciones separadas.

## Acceso y ownership

Los cuatro desarrollan sin cuentas Google ni secretos personales. Sebastián ejecuta pruebas reales del sandbox por canal administrativo; OAuth drive.file restringido a recursos concedidos y Firestore separado, sin compartir refresh token/clave con developers. Falta integrar/configurar autorización segura en staging (Paty); el puente local dev no soluciona ese acceso. Acceso nominal CROFI pendiente de correo. No compartir bypass público ni habilitar facturación/producción.

Alternativa aprobada para Paty: si ya dispone de sandbox Google propio autorizado, puede mantenerlo para pruebas reales aisladas, con el mismo contrato, garantías de privacidad/integridad y datos ficticios. Las herramientas/mock y el sandbox de Sebastián son apoyo opcional, no requisito de migración ni espera para desarrollar. No se afirma haber auditado ese entorno. Credenciales privadas de su cuenta nunca se comparten/versionan; CI sigue mock y QA del staging integrado continúa separado. Esta alternativa no autoriza ampliar acceso a otros archivos ni crear costos/recursos nuevos.

Alejandro: formulario/helpers cliente; Paty: handler/adapters/reserva/schemas servidor; Pastor: workflows/harness/suites de release; Alejandra: páginas estáticas/footer/reglamentos/estilos delimitados. Este acuerdo y fixtures se preparan por coordinación; no son una entrega previa de un developer. Cambios incompatibles requieren coordinación y actualización de contrato/fixtures, no un merge del compañero como prerrequisito. Ninguno reemplaza global.css completo.

Aceptación individual contra mocks compatible con main; aceptación del equipo sobre snapshot integrado protegido exige navegador → una fila/tres archivos privados, folio real, duplicados/fallos, móviles y capacidad. No confundir independencia de desarrollo con aceptación de cuatro simulaciones.
