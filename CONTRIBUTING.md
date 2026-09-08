# Contribuir a Copa Ollin

Gracias por colaborar. Durante esta etapa el repositorio es la fuente de verdad documental del proyecto; todavía no representa una arquitectura aprobada.

## Flujo de trabajo

1. Busca un issue existente antes de abrir uno nuevo.
2. Asegúrate de que el issue tenga un objetivo pequeño y criterios de aceptación verificables.
3. Crea una rama corta desde `main`:
   - `docs/nombre-corto` para documentación;
   - `feat/nombre-corto` para funcionalidad futura;
   - `fix/nombre-corto` para correcciones futuras;
   - `chore/nombre-corto` para mantenimiento.
4. Realiza commits claros siguiendo Conventional Commits, preferentemente en español.
5. Abre un pull request, enlaza el issue y explica cómo verificaste el cambio.
6. Solicita al menos una revisión y resuelve todas las conversaciones antes del merge.
7. Usa *squash merge* para conservar un historial legible.

No hagas push directo a `main` ni reescribas su historial.

## Requisitos y decisiones

- Cita el documento fuente y la sección afectada.
- No conviertas una pregunta abierta en requisito sin registrar la decisión de la mesa directiva.
- Si el Markdown y el PDF difieren, conserva el PDF, abre un issue de aclaración y no adivines la intención.
- Las decisiones de arquitectura deberán quedar documentadas cuando esa fase comience.

## Convenciones de commits

Ejemplos:

```text
docs(reglamentos): corregir medidas de minisumo amateur
docs(requisitos): registrar decisión sobre tamaño de archivos
feat(registro): validar integrantes por categoría
fix(formulario): conservar archivos al corregir un campo
```

## Antes de solicitar revisión

- Revisa ortografía, enlaces relativos y formato Markdown.
- Confirma que las imágenes y documentos referenciados existen.
- Describe cualquier cambio visible y adjunta capturas cuando exista interfaz.
- Verifica que no incluyes secretos ni datos personales.
- Mantén el PR dentro del alcance del issue; separa cambios no relacionados.

## Información que nunca debe publicarse

No agregues al repositorio, issues ni pull requests:

- credenciales, tokens, secretos o archivos `.env`;
- identificaciones, comprobantes, teléfonos o datos de participantes;
- enlaces operativos de Google Drive o Sheets;
- datos internos de acceso o información recibida por canales privados.

Ante una duda de privacidad o seguridad, detén la publicación y sigue [SECURITY.md](SECURITY.md).
