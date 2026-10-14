# Artefacto de Falla Controlada

Se ejecutó una prueba simulando un error 502 (Bad Gateway) para verificar el manejo de excepciones y garantizar la ausencia de Información de Identificación Personal (PII) o secretos en la traza.

## Traza del error (Recuperable)
\`\`\`json
{
  "timestamp": "2026-10-06T12:00:00Z",
  "level": "error",
  "code": "TEMPORARY_STORAGE_ERROR",
  "message": "El almacenamiento de pruebas no respondió",
  "transactionId": "reg-carga-ficticia-0",
  "request_size_bytes": 1024,
  "files_attached": 3
}
\`\`\`

## Inspección de Seguridad
- **Secretos:** Ausentes. No se capturan tokens OAuth ni variables de entorno en los logs.
- **PII:** Ausente. No se registran nombres, correos ni teléfonos de los participantes en el error, únicamente identificadores opacos (`transactionId`).
- **Documentos:** Los archivos PDF no se vuelcan a memoria ni a los logs de la consola en caso de fallo.