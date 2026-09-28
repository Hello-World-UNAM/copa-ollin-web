# Guía de pruebas del sandbox de Google

Esta guía distingue las pruebas locales del mock de la prueba remota autorizada contra Google. Todas las identidades, registros y documentos de prueba deben ser ficticios. El endpoint no está habilitado para inscripciones públicas.

## 1. Preparar el proyecto

Desde la raíz del repositorio, confirma las versiones y sincroniza dependencias:

```bash
node --version
pnpm --version
pnpm install --frozen-lockfile
```

Se esperan Node `v22.23.2` y pnpm `11.3.0`. El archivo `.env` es local y está ignorado por Git. Si no existe, copia `.env.example` a `.env`; si ya existe, conserva su contenido y agrega solamente las claves necesarias. Nunca copies una llave JSON, token, ID o URL de recursos a GitHub, al chat, capturas o pull requests.

Para el modo local, conserva:

```dotenv
ENABLE_SANDBOX_REGISTRATION=true
USE_MOCK_GOOGLE=true
ENABLE_REAL_GOOGLE_SANDBOX=false
```

## 2. Ejecutar pruebas locales sin Google

Estas pruebas no necesitan cuenta, red ni recursos de Google. Los PDFs se generan dentro de Vitest y contienen exclusivamente datos ficticios.

```bash
pnpm test
```

La suite prueba el handler de multipart y el adapter mock: endpoint deshabilitado, payload válido, tres PDFs, reintento sin duplicar, campos desconocidos o repetidos, MIME y firma PDF, tamaño máximo, descripción, configuración y respuesta de recuperación segura. La integración real remota permanece omitida en esta ejecución.

## 3. Prerrequisitos antes de tocar Google

**No ejecutes la prueba remota mientras P0-06 siga sin aprobación.** El documento de preguntas abiertas indica que los formatos, cantidades y tamaños de archivos siguen pendientes y que no se debe aceptar una prueba de carga de archivos sin resolver esa decisión. Solicita que la persona autorizada confirme por escrito el experimento concreto: un PDF ficticio por documento y un máximo de 5 MiB por archivo. Esta condición es solo para el sandbox; no convierte esos límites en requisito productivo.

Una vez autorizada la prueba:

1. Hello World crea una hoja y carpeta exclusivas de sandbox. No reutilices recursos de CROFI ni producción. Para cargas mediante una Service Account, usa una carpeta de una **Unidad compartida**; las cuentas de servicio no tienen cuota propia en Mi unidad para ser propietarias de archivos.
2. En Google Cloud, habilita Google Sheets API y Google Drive API para el proyecto de pruebas.
3. Crea una Service Account de pruebas y una llave JSON local. Guarda la llave en `.private/sandbox-service-account.json`; `.private/` está ignorado por Git. No la abras ni la pegues en el chat.
4. Comparte únicamente la hoja y carpeta de sandbox con la identidad de esa Service Account y permisos de edición necesarios. En la Unidad compartida, usa el rol mínimo que permita crear y eliminar los archivos de prueba (normalmente Content manager). No habilites enlaces públicos.
5. En la hoja, crea una pestaña llamada `Registros` y una fila de encabezados en este orden: `transactionId`, `nombreEquipo`, `categoria`, `institucion`, `estadoCiudadProcedencia`, `nombreCapitan`, `correoCapitan`, `telefonoCapitan`, `identificacionInstitucional`, `integrantes`, `nombreRobot`, `descripcionRobot`, `aceptaReglamento`, `aceptaUsoImagen`, `confirmaRestriccionesCategoria`, `archivoIdentificacion`, `comprobantePago`, `cartaResponsiva`.

## 4. Configurar el entorno local

Edita `.env` localmente, sin mostrar sus valores en la terminal o en una captura. Conserva el valor existente de `ENABLE_SANDBOX_REGISTRATION` y completa estas claves con los datos de los recursos aislados. Si moviste la carpeta a una Unidad compartida, sustituye el ID anterior por el de la carpeta nueva:

```dotenv
GOOGLE_APPLICATION_CREDENTIALS=.private/sandbox-service-account.json
SANDBOX_GOOGLE_SPREADSHEET_ID=ID_DE_LA_HOJA_SANDBOX
SANDBOX_GOOGLE_SHEET_RANGE=Registros!A:R
SANDBOX_GOOGLE_DRIVE_FOLDER_ID=ID_DE_LA_CARPETA_SANDBOX
```

No agregues esos valores a `.env.example`. La prueba remota no necesita cambiar la selección del adapter de la aplicación: construye el adapter real directamente desde el test autorizado y pasa por el mismo handler de validación.

## 5. Ejecutar la prueba remota autorizada

Solo después de la aprobación escrita de P0-06 y de completar el sandbox aislado, ejecuta:

```bash
RUN_GOOGLE_SANDBOX_INTEGRATION=true SANDBOX_GOOGLE_FILE_TEST_AUTHORIZED=true pnpm test:google-sandbox
```

El test genera un `transactionId` aleatorio y tres PDFs válidos. Envía dos veces el mismo payload; comprueba que Sheets contenga una sola fila y Drive los tres archivos asociados; después elimina la fila y archivos que creó y verifica que no quede ninguno. El test no imprime ni guarda IDs operativos, URLs de los recursos ni payloads.

Si el test falla durante la limpieza, no repitas inmediatamente: inspecciona únicamente los recursos de sandbox autorizados, elimina cualquier fila o PDF que empiece con el prefijo `copa-ollin-qa-` de la corrida y deja constancia sanitizada de la incidencia. No borres elementos ajenos a la prueba.

### Si el preflight o la carga devuelve 403/404

- Detén los reintentos de escritura; no cambies a recursos productivos ni hagas público el acceso.
- HTTP 403 puede indicar API deshabilitada o permiso insuficiente; en una carga de Drive también puede reflejar que la Service Account no tiene cuota/rol de creación en el destino.
- HTTP 404 al consultar una carpeta puede significar ID equivocado o que la identidad autenticada no puede verla. Verifica localmente que el ID sea el de la carpeta dentro de la Unidad compartida, no el ID de la Unidad ni una carpeta de Mi unidad.
- Comprueba por separado el acceso de lectura a la hoja y la pertenencia/rol de la Service Account en la Unidad compartida. No compartas IDs, correos, respuestas JSON completas ni URLs al reportar el resultado.
- Reanuda el test de escritura únicamente después de que el preflight confirme hoja accesible y carpeta accesible dentro de la Unidad compartida.

## 6. Comprobar el resultado y compartir QA

Al finalizar, ejecuta los checks del repositorio:

```bash
pnpm format:check
pnpm lint
pnpm check
pnpm test
pnpm build
git diff --check
git status --short --branch
```

El reviewer debe comprobar en el entorno restringido la hoja y carpeta sin compartir capturas que revelen valores, IDs o enlaces. La evidencia versionada puede indicar fecha, resultado, cantidades verificadas y confirmación de limpieza, sin contenido del registro. La revisión de permisos, snapshot de staging, commit desplegado y QA posterior al merge siguen siendo tareas del flujo de pull request.

## 7. Límites conocidos

- `transactionId` es una clave técnica de este harness de pruebas; su semántica productiva sigue pendiente de P2-02.
- El control de duplicados consulta Sheets y es adecuado para probar reintentos secuenciales. No constituye una garantía distribuida de exclusión para dos solicitudes concurrentes al mismo tiempo.
- Si Drive confirma una carga pero se pierde la respuesta antes de recibir su ID, el cleanup automático no puede identificar ese archivo; revisa el sandbox después de una falla remota.
- El modo mock no prueba credenciales, cuota, permisos efectivos ni disponibilidad de Google.
- Nada de esta guía habilita producción o el procesamiento de datos reales.
