# Contrato Provisional de Registro

**Estado:** 🛑 PROVISIONAL / NO PRODUCTIVO.

## Campos Conocidos (Base del SRS/Kit)
* `nombreEquipo` (string)
* `categoria` (string)
* `nombreCapitan` (string)
* `integrantes` (array)
* `institucion` (string)

## Restricciones y Bloqueos
* **Archivos adjuntos:** Pendiente de resolución. No se deben definir tamaños ni formatos (Dependencia: [P1-05 a P1-08](../requirements/preguntas-abiertas.md)).
* **Datos Personales y Sensibles:** Prohibido recolectar comprobantes, identificaciones o cartas responsivas hasta aprobar el aviso de privacidad (Dependencia: [P0-05, P0-06](../requirements/preguntas-abiertas.md)).
* **Validaciones:** No suponer validaciones de montos, formatos de archivos ni consentimientos.

La ruta `/registro` permanecerá "en preparación" y no procesará estos datos ni habilitará campos de entrada hasta resolver las dependencias mencionadas.