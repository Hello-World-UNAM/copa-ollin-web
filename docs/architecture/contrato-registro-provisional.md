# Contrato Provisional de Registro

**Estado:** 🛑 PROVISIONAL / NO PRODUCTIVO.

## Campos conocidos (base del SRS y del kit)

Estos nombres describen información conocida, no un API productiva ni una autorización para capturarla.

### Equipo

- `nombreEquipo` (string)
- `categoria` (string; puede cambiar cuando CROFI entregue categorías adicionales)
- `institucion` (string)
- `estadoCiudadProcedencia` (string)

### Capitán

- `nombreCapitan` (string)
- `correoCapitan` (string)
- `telefonoCapitan` (string)
- `identificacionInstitucional` (string; opcional para universitarios según el kit)
- `archivoIdentificacion` (archivo; CROFI confirmó que se requiere, pero su procesamiento sigue bloqueado)

### Integrantes

- `integrantes` (array)
- `integrantes[].nombre` (string)
- `integrantes[].correo` (string; opcional)

### Robot

- `nombreRobot` (string)
- `descripcionRobot` (string; máximo de 300 palabras según el kit)

### Confirmaciones y documentos

- `aceptaReglamento` (boolean; alcance y firmante pendientes)
- `aceptaUsoImagen` (boolean; alcance y firmante pendientes)
- `confirmaRestriccionesCategoria` (boolean)
- `comprobantePago` (archivo; confirmado como requerido, sin procesamiento productivo)
- `cartaResponsiva` (archivo; confirmado como requerida, sin formato definitivo)

## Contrato técnico actual del endpoint de sandbox

Esta sección describe lo que implementa actualmente `POST /api/register`; no
declara un contrato productivo ni confirma que el formulario ya consuma esta
ruta. La interfaz continúa usando `submitRegistroSandboxMock` hasta completar
la coordinación con el issue #18.

- **Formato:** `multipart/form-data`.
- **Campos:** los nombres anteriores más `transactionId`, que el esquema del
	servidor exige actualmente como identificador técnico de sandbox.
- **Integrantes:** el campo `integrantes` se envía como texto JSON que contiene
	un arreglo de objetos con `nombre` y `correo` opcional.
- **Booleanos:** las tres confirmaciones se envían como los textos `true` o
	`false` en multipart y el servidor los convierte a booleanos.
- **Archivos:** `archivoIdentificacion`, `comprobantePago` y
	`cartaResponsiva`; cada PDF admite hasta 1 MiB y el total de los tres no debe
	exceder 3 MiB. El cuerpo multipart permite margen técnico para campos y
	delimitadores.
- **Autorización de sandbox:** la ruta requiere `Authorization: Bearer <token>`
	configurado sólo en el servidor. El token no forma parte del formulario y no
	debe incluirse en JavaScript cliente, fixtures con secretos ni evidencia.

### Correspondencia entre la hoja y el formulario actual

Las 18 columnas son el formato de almacenamiento en Sheets; no representan 18
controles que deban mostrarse literalmente a la persona participante.

| Columna de Sheets | Campo del formulario o endpoint | Situación actual |
|---|---|---|
| `transactionId` | `transactionId` | Campo técnico oculto: el formulario genera un UUID por borrador y lo conserva durante reintentos en la misma sesión. Decisión provisional de sandbox aprobada por la responsable de #10 el 4 de octubre de 2026; no es un campo que escriba la persona participante. |
| `nombreEquipo` | `nombreEquipo` | Capturado en el paso Equipo. |
| `categoria` | `categoria` | Capturada como slug de categoría. |
| `institucion` | `institucion` | Capturada en el paso Equipo. |
| `estadoCiudadProcedencia` | `estadoCiudadProcedencia` | Capturado en el paso Equipo. |
| `nombreCapitan` | `nombreCapitan` | Capturado en el paso Capitán. |
| `correoCapitan` | `correoCapitan` | Capturado en el paso Capitán. |
| `telefonoCapitan` | `telefonoCapitan` | Capturado en el paso Capitán. |
| `identificacionInstitucional` | `identificacionInstitucional` | Captura opcional actual. |
| `integrantes` | `integrantes` | Arreglo de integrantes del formulario; el adapter lo serializa como JSON en una celda. |
| `nombreRobot` | `nombreRobot` | Capturado en el paso Robot. |
| `descripcionRobot` | `descripcionRobot` | Capturada en el paso Robot, con máximo de 300 palabras. |
| `aceptaReglamento` | `aceptaReglamento` | Confirmación actual. |
| `aceptaUsoImagen` | `aceptaUsoImagen` | Confirmación actual. |
| `confirmaRestriccionesCategoria` | `confirmaRestriccionesCategoria` | Confirmación actual. |
| `archivoIdentificacion` | `archivoIdentificacion` | Selector activo para PDF ficticio; validado en el navegador, pero no enviado ni guardado. |
| `comprobantePago` | `comprobantePago` | Selector activo para PDF ficticio; validado en el navegador, pero no enviado ni guardado. |
| `cartaResponsiva` | `cartaResponsiva` | Selector activo para PDF ficticio; validado en el navegador, pero no enviado ni guardado. |

Por tanto, no hace falta recrear desde cero los campos de texto existentes.
Los archivos y `transactionId` ya forman parte del payload local del formulario,
pero el submit sigue llamando al mock y no los transmite. Antes de conectarlo
al endpoint, falta coordinar esta forma del contrato con #18 y diseñar una
autorización compatible que no exponga el token server-side al navegador.

### Respuestas implementadas

| HTTP | Código | Significado técnico actual |
|---|---|---|
| `200` | `SAVED` | El adapter reportó que guardó el registro de sandbox. |
| `200` | `DUPLICATE` | El adapter detectó un duplicado según su implementación actual. |
| `400` | `INVALID_MULTIPART`, `UNEXPECTED_FIELD`, `REPEATED_FIELD` o `VALIDATION_ERROR` | La petición o sus campos/archivos no cumplen el esquema de sandbox. |
| `401` | `SANDBOX_UNAUTHORIZED` | Falta el token de acceso o no es válido. |
| `413` | `PAYLOAD_TOO_LARGE` | El cuerpo excede el máximo técnico permitido. |
| `502` | `RECOVERY_REQUIRED` o `TEMPORARY_STORAGE_ERROR` | Falló el almacenamiento o se requiere reconciliar/limpiar el sandbox. |
| `503` | `SANDBOX_DISABLED` o `SANDBOX_AUTH_NOT_CONFIGURED` | El sandbox está deshabilitado o carece de configuración de acceso. |
| `500` | `INTERNAL_ERROR` | Ocurrió un error no clasificado. |

Estos códigos describen la implementación actual; Alejandro debe confirmar qué
respuestas necesita manejar la interfaz del issue #18 antes de conectar el
formulario.

El adaptador real todavía no garantiza exclusión entre solicitudes simultáneas:
lee Sheets y después agrega la fila. La prueba concurrente del mock cubre sólo
el comportamiento de una instancia en memoria y no satisface ese criterio del
issue #10.

## Restricciones y bloqueos

- **Documentos y pago:** CROFI confirmó comprobante de pago, identificación y carta responsiva, así como un pago de $100 MXN por robot mediante transferencia. El formato operativo, los límites y el flujo de validación permanecen condicionados por [P0-06](../requirements/preguntas-abiertas.md).
- **Archivos adjuntos:** no deben definirse tamaños ni formatos productivos hasta resolver [P1-05 a P1-07](../requirements/preguntas-abiertas.md).
- **Consentimientos:** no deben suponerse alcance, firmante ni tratamiento para menores; dependen de [P1-08](../requirements/preguntas-abiertas.md).
- **Datos personales y sensibles:** el flujo técnico puede construirse y probarse en un sandbox restringido únicamente con datos y documentos claramente ficticios. Está prohibido habilitarlo al público o recolectar información real hasta aprobar el aviso de privacidad y sus responsables ([P2-04](../requirements/preguntas-abiertas.md)).
- **Estados e idempotencia:** no definir estados de inscripción, folios, duplicados, correcciones o cancelaciones hasta resolver [P2-01 a P2-03](../requirements/preguntas-abiertas.md).
- **Identificador técnico del endpoint:** `transactionId` es obligatorio en el esquema actual y no es un campo visible para participantes. La responsable de #10 aprobó provisionalmente un UUID generado por el formulario y reutilizado en reintentos del borrador abierto; queda pendiente coordinar formato y respuestas con #18. Esto no añade idempotencia persistente ni exclusión distribuida ante concurrencia.
- **Retención y acceso:** no definir conservación, eliminación ni permisos operativos hasta resolver [P2-05 y P2-06](../requirements/preguntas-abiertas.md).
- **Validaciones:** no suponer validaciones de montos, formatos de archivos ni consentimientos.

La ruta pública `/registro` permanecerá "en preparación" hasta resolver las dependencias mencionadas. El equipo puede desarrollar el recorrido completo detrás de una separación inequívoca de sandbox, sin datos reales y sin presentarlo como registro productivo. La habilitación pública conserva como gate obligatorio el aviso de privacidad aprobado por CROFI.
