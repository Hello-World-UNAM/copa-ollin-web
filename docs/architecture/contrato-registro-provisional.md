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

## Restricciones y bloqueos

- **Documentos y pago:** CROFI confirmó comprobante de pago, identificación y carta responsiva, así como un pago de $100 MXN por robot mediante transferencia. El formato operativo, los límites y el flujo de validación permanecen condicionados por [P0-06](../requirements/preguntas-abiertas.md).
- **Archivos adjuntos:** no deben definirse tamaños ni formatos productivos hasta resolver [P1-05 a P1-07](../requirements/preguntas-abiertas.md).
- **Consentimientos:** no deben suponerse alcance, firmante ni tratamiento para menores; dependen de [P1-08](../requirements/preguntas-abiertas.md).
- **Datos personales y sensibles:** el flujo técnico puede construirse y probarse en un sandbox restringido únicamente con datos y documentos claramente ficticios. Está prohibido habilitarlo al público o recolectar información real hasta aprobar el aviso de privacidad y sus responsables ([P2-04](../requirements/preguntas-abiertas.md)).
- **Estados e idempotencia:** no definir estados de inscripción, folios, duplicados, correcciones o cancelaciones hasta resolver [P2-01 a P2-03](../requirements/preguntas-abiertas.md).
- **Retención y acceso:** no definir conservación, eliminación ni permisos operativos hasta resolver [P2-05 y P2-06](../requirements/preguntas-abiertas.md).
- **Validaciones:** no suponer validaciones de montos, formatos de archivos ni consentimientos.

La ruta pública `/registro` permanecerá "en preparación" hasta resolver las dependencias mencionadas. El equipo puede desarrollar el recorrido completo detrás de una separación inequívoca de sandbox, sin datos reales y sin presentarlo como registro productivo. La habilitación pública conserva como gate obligatorio el aviso de privacidad aprobado por CROFI.
