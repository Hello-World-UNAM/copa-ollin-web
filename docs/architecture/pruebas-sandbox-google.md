# Guía de pruebas del sandbox de Google

Esta guía distingue las pruebas locales del mock de la prueba remota autorizada contra Google. Todas las identidades, registros y documentos de prueba deben ser ficticios. El endpoint no está habilitado para inscripciones públicas.

## 1. Preparar el proyecto

Desde la raíz del repositorio, confirma las versiones y sincroniza dependencias:

```bash
node --version
pnpm --version
pnpm install --frozen-lockfile
```

Se esperan Node `v22.23.2` y pnpm `11.3.0`. El archivo `.env` es local y está ignorado por Git. Si no existe, copia `.env.example` a `.env`; si ya existe, conserva su contenido y agrega solamente las claves necesarias. Nunca copies secretos OAuth, tokens, IDs o URLs de recursos a GitHub, al chat, capturas o pull requests.

Para el modo local, conserva:

```dotenv
ENABLE_SANDBOX_REGISTRATION=true
USE_MOCK_GOOGLE=true
ENABLE_REAL_GOOGLE_SANDBOX=false
```

El endpoint del sandbox requiere además `SANDBOX_REGISTRATION_TOKEN`, leído
únicamente por el servidor. Usa un token aleatorio local y guárdalo sólo en
`.env` ignorado por Git; no lo agregues al cliente, a GitHub ni a capturas. Las
pruebas unitarias usan un valor ficticio aislado. En una prueba remota, la
persona autorizada debe proporcionar el token al cliente de prueba por un canal
seguro; no se comparte su valor en el issue ni en la evidencia.

## 2. Ejecutar pruebas locales sin Google

Estas pruebas no necesitan cuenta, red ni recursos de Google. Los PDFs se generan dentro de Vitest y contienen exclusivamente datos ficticios.

```bash
pnpm test
```

La suite prueba el handler de multipart y el adapter mock: endpoint deshabilitado, payload válido, tres PDFs, reintento sin duplicar, campos desconocidos o repetidos, MIME y firma PDF, tamaño máximo, descripción, configuración y respuesta de recuperación segura. La integración real remota permanece omitida en esta ejecución.

El E2E local de #20 se ejecuta con `pnpm test:e2e`. Playwright inicia Astro en
localhost, habilita el endpoint sólo para ese servidor, configura un token
ficticio de test y selecciona el adapter mock. El test añade ese token a la
petición con `page.route`; no se incluye en el bundle del formulario. Así se
prueban formulario, serialización, autorización del endpoint y respuesta HTTP
sin usar Google ni Vercel. Esta prueba local no sustituye la prueba remota ni
verifica OAuth, permisos efectivos, Picker o persistencia en Sheets/Drive.

## 3. Prerrequisitos antes de tocar Google

La prueba remota requiere autorización explícita para usar los recursos del sandbox. Usa únicamente PDFs ficticios: máximo 1 MiB por archivo y 3 MiB en conjunto, según el issue #10. Estos límites son provisionales para el sandbox y no definen requisitos productivos.

Una vez autorizada la prueba:

1. Usa la hoja y carpeta exclusivas del sandbox creadas en la cuenta autorizada. No reutilices recursos de CROFI ni producción; confirma que el acceso esté restringido.
2. En Google Cloud, habilita Google Sheets API, Google Drive API, Google Picker API y Cloud Firestore API en el proyecto de pruebas.
3. Configura cliente OAuth para la cuenta propietaria de los recursos. El consentimiento debe solicitar únicamente `https://www.googleapis.com/auth/drive.file`; no solicites scopes `drive` ni `spreadsheets`.
4. La hoja y carpeta del sandbox deben seleccionarse explícitamente mediante Google Picker o crearse con esa misma aplicación. La selección es un paso administrativo único, no parte del registro de participantes.
5. Guarda client ID, client secret y refresh token sólo en secretos protegidos del servidor o en `.env` local ignorado por Git. El refresh token de OAuth en modo Testing puede vencer a los siete días; documenta renovación y revocación sin registrar su valor.
6. En Firestore, comprueba primero si ya existe una base. Usa sólo la base `(default)`, que es la elegible para la cuota gratuita; no crees una segunda. Al crearla, elige edición **Standard**, API **Native mode** y reglas iniciales **Production mode** (el servidor usa IAM; el cliente web no debe acceder directamente).
7. La ubicación de Firestore no se puede cambiar después de crear la base. Si la consola ofrece `northamerica-south1` (Querétaro), es la opción regional más cercana a la sede del evento. Si una ubicación predeterminada ya está fijada, o no aparece la región esperada, detente antes de crearla y revisa la ubicación mostrada; no crees otra base para probar.
8. Crea una service account separada para la reserva Firestore y dale el rol `Cloud Datastore User` (`roles/datastore.user`) únicamente en el proyecto aislado de pruebas. Ese rol da acceso de lectura/escritura a documentos Firestore del proyecto, por eso no reutilices la identidad en producción ni le concedas roles de Drive/Sheets.
9. Crea una clave JSON para esa service account sólo si vas a probar localmente con el código actual. Guárdala como `.private/firestore-sandbox.json` (ignorado por Git) con permisos `600`. Importa sus campos mediante `node scripts/sandbox-google-local.mjs --firestore-key .private/firestore-sandbox.json`; no copies la clave manualmente al navegador, chat, issue ni archivos versionados. El asistente conserva la configuración privada local. Revoca esta clave desde IAM al terminar las pruebas y no la reutilices en producción. Tras asignar el rol, su propagación puede tardar varios minutos: un rechazo inicial no justifica conceder Editor/Propietario ni desactivar la reserva.
10. En la hoja, crea una pestaña llamada `Registros` y una fila de encabezados en este orden: `transactionId`, `nombreEquipo`, `categoria`, `institucion`, `estadoCiudadProcedencia`, `nombreCapitan`, `correoCapitan`, `telefonoCapitan`, `identificacionInstitucional`, `integrantes`, `nombreRobot`, `descripcionRobot`, `aceptaReglamento`, `aceptaUsoImagen`, `confirmaRestriccionesCategoria`, `archivoIdentificacion`, `comprobantePago`, `cartaResponsiva`. El folio se guarda como columna 19 (`folio`, celda `S1`); el preflight sigue leyendo sólo `A1:R1`. Ver [vista-operativa-sheets.md](./vista-operativa-sheets.md).

Firestore documenta para una base elegible la cuota gratuita de 1 GiB,
50.000 lecturas por día, 20.000 escrituras por día, 20.000 eliminaciones por
día y 10 GiB de salida al mes; las cuotas se restablecen diariamente según el
horario de Google. Este spike no autoriza habilitar facturación, usar funciones
premium ni aceptar cargos. Detén la configuración si se requiere un plan pagado
o no se puede mantener el sandbox dentro de los límites gratuitos. Consulta
[precios/cuotas](https://firebase.google.com/docs/firestore/pricing),
[ubicaciones](https://firebase.google.com/docs/firestore/locations) y
[roles IAM](https://firebase.google.com/docs/firestore/security/iam) antes de
crear la base o asignar permisos.

### Estado de OAuth y Google Picker en el repositorio

El adapter server-side consume client ID, client secret y refresh token. El
PR #26 incorporó el selector administrativo local descrito abajo; seleccionar
recursos no obtiene ni guarda por sí mismo un refresh token del servidor.
La aplicación Astro no implementa `/api/auth/google/callback`: no registres
esa URI. El asistente local descrito en la sección 4 usa su propio callback en
el puerto 4338; no es una ruta de Astro ni una autenticación de staging.

Google Picker para web necesita su API habilitada, una API key restringida al
origen autorizado y al API Picker, y un token OAuth de corta duración para que
la persona autorizada seleccione archivos. La API key no concede acceso a los
archivos. El client secret y el refresh token permanecen sólo en el servidor.
No se declara cumplido el criterio de selección/creación con la app hasta que
ese flujo administrativo esté implementado y probado.

La ruta de selección administrativa local es
`http://localhost:4321/admin/sandbox-google`; sólo se activa con Astro en
modo desarrollo y el host `localhost` o `127.0.0.1`. En `.env` también se
necesitan `SANDBOX_GOOGLE_PICKER_API_KEY` y
`SANDBOX_GOOGLE_PROJECT_NUMBER`. El client ID, API key y número de proyecto son
configuración pública restringida que la página local usa para Picker; el
client secret, refresh token y credencial Firestore nunca se pasan a la isla
React. Al seleccionar cada recurso, usa el botón para copiar su ID y pégalo
directamente en `.env`; la interfaz no lo muestra ni registra.

## 4. Configurar el entorno local

### Prueba interactiva desde el navegador local

Decisión del 4 de octubre de 2026: Sebastián autorizó preparar una prueba con
su cuenta y recursos Google aislados. Para ese caso existe un puente opt-in
`LOCAL_SANDBOX_BROWSER_AUTH=true`: sólo Astro **dev**, conexión loopback,
hostname local y `Origin` idéntico. Rechaza cabeceras de proxy y no reemplaza un
Bearer ya proporcionado. El token se añade en servidor; nunca se envía al
bundle. No autoriza staging ni producción. Inicia Astro siempre con
`--host 127.0.0.1`; no expongas ese proceso en la LAN ni por túnel. Otros procesos
locales de tu equipo son parte del perímetro de confianza.

Las variables sensibles de Vercel no se pueden recuperar como credenciales
mediante `vercel env pull`: los valores ocultos no sirven para autenticar.
No confundas variables declaradas con secretos descargables ni con acceso
Google verificado. El adapter actual utiliza `SANDBOX_GOOGLE_OAUTH_*`; los
nombres históricos `GOOGLE_OAUTH_*` no son consumidos por este código.

El asistente `scripts/sandbox-google-local.mjs` recibe el JSON de cliente OAuth
web autorizado y un inventario Markdown privado con los enlaces de carpeta
raíz, documentos ficticios y hoja Registros. No publiques ese inventario.
El callback debe estar registrado exactamente como
`http://localhost:4338/oauth/callback`.

```bash
node scripts/sandbox-google-local.mjs --authorize \
  --client /ruta/privada/cliente-oauth.json \
  --resources /ruta/privada/inventario-sandbox.md
```

Abre `http://localhost:4338/` y autoriza con la cuenta del sandbox. Sólo solicita
`drive.file`, comprueba los scopes devueltos y guarda el refresh token en
`.private/google-sandbox-local.env` con permisos `600`. Usa `state`, cookie
HttpOnly/SameSite y sesión de diez minutos; no muestra tokens ni registra el
callback. Detén el asistente al terminar. No concede acceso automático a
recursos de otra app: si el preflight falla con 403/404, selecciona los recursos
con Picker para esa misma app; nunca amplíes scopes para evitar ese paso.

La reserva Firestore sigue siendo obligatoria para este adapter. Usa una cuenta
de servicio del proyecto de pruebas aislado, base `(default)` y rol mínimo
descrito arriba; no habilites facturación ni utilices una clave productiva.

```bash
node scripts/sandbox-google-local.mjs --firestore-key .private/firestore-sandbox.json
node scripts/sandbox-google-local.mjs --preflight
node scripts/sandbox-google-local.mjs --serve
```

El preflight sólo lee scopes, tipos, padres, permisos y los 18 encabezados de
`Registros!A1:R1`. Requiere que hoja y carpeta pertenezcan a la raíz autorizada
y no tengan acceso público/de dominio. `--serve` también verifica lectura de
Firestore antes de levantar Astro en loopback con el adapter **real** y el
puente local. Detén antes el otro Astro dev del mismo repo: Astro sólo admite
uno aunque se cambie el puerto. Si falta configuración, no inicia el modo real
ni escribe Google. No elimina filas ni archivos después de tu envío manual.

Recarga `/registro` y empieza un formulario nuevo con datos y PDFs ficticios,
sin reutilizar documentos personales de pruebas anteriores. El envío debe
crear una fila y tres archivos privados; verificar sus enlaces y reintento.
Los registros de prueba permanecen para inspección hasta que se autorice su
limpieza. Una prueba mock no sustituye esta comprobación real.

Referencias: [OAuth web server](https://developers.google.com/identity/protocols/oauth2/web-server)
y [scope drive.file](https://developers.google.com/workspace/drive/api/guides/api-specific-auth).

Edita `.env` localmente, sin mostrar sus valores en la terminal o en una captura. Conserva el valor existente de `ENABLE_SANDBOX_REGISTRATION` y completa estas claves con OAuth y los recursos aislados seleccionados para esta aplicación:

```dotenv
SANDBOX_GOOGLE_OAUTH_CLIENT_ID=CLIENT_ID_OAUTH
SANDBOX_GOOGLE_OAUTH_CLIENT_SECRET=SECRETO_OAUTH
SANDBOX_GOOGLE_OAUTH_REFRESH_TOKEN=REFRESH_TOKEN_OAUTH
SANDBOX_GOOGLE_PICKER_API_KEY=API_KEY_PICKER_RESTRINGIDA
SANDBOX_GOOGLE_PROJECT_NUMBER=NUMERO_PROYECTO
SANDBOX_REGISTRATION_TOKEN=TOKEN_ALEATORIO_SOLO_LOCAL
SANDBOX_GOOGLE_SPREADSHEET_ID=ID_DE_LA_HOJA_SANDBOX
SANDBOX_GOOGLE_SHEET_RANGE=Registros!A:R
SANDBOX_GOOGLE_DRIVE_FOLDER_ID=ID_DE_LA_CARPETA_SANDBOX
SANDBOX_FIRESTORE_PROJECT_ID=PROYECTO_SANDBOX
SANDBOX_FIRESTORE_CLIENT_EMAIL=CUENTA_DE_SERVICIO_FIRESTORE
SANDBOX_FIRESTORE_PRIVATE_KEY=CLAVE_PRIVADA_DE_SERVICIO
```

No agregues esos valores a `.env.example`. La prueba remota no necesita cambiar la selección del adapter de la aplicación: construye el adapter real directamente desde el test autorizado y pasa por el mismo handler de validación. El refresh token debe corresponder al consentimiento con el único scope `drive.file` y a los recursos seleccionados para la aplicación.

La service account Firestore es una identidad separada del usuario OAuth que
accede a Sheets/Drive. Su clave nunca se entrega al cliente. La transacción de
Firestore crea la reserva atómica antes de iniciar cargas; Sheets y Drive
siguen siendo los destinos operativos del registro.

Antes de leer o escribir recursos, el preflight remoto consulta los scopes del
token de acceso y aborta si no aparece exactamente
`https://www.googleapis.com/auth/drive.file`.

## 5. Ejecutar la prueba remota autorizada

Solo después de recibir autorización explícita para la prueba remota y completar el sandbox aislado, ejecuta:

```bash
RUN_GOOGLE_SANDBOX_INTEGRATION=true SANDBOX_GOOGLE_FILE_TEST_AUTHORIZED=true pnpm test:google-sandbox
```

El test genera un `transactionId` aleatorio y tres PDFs válidos. Envía dos
solicitudes simultáneas con el mismo payload y un reintento posterior;
comprueba que Sheets contenga una sola fila y Drive los tres archivos
asociados. Después elimina la fila, archivos y reserva que creó y comprueba
que no queden fila ni archivos. Invoca el handler directamente: no prueba el
transporte HTTP de Vercel ni el navegador de staging. El test no imprime ni
guarda IDs operativos, URLs de los recursos ni payloads.

Si el test falla durante la limpieza, no repitas inmediatamente: inspecciona únicamente los recursos de sandbox autorizados, elimina cualquier fila o PDF que empiece con el prefijo `copa-ollin-qa-` de la corrida y deja constancia sanitizada de la incidencia. No borres elementos ajenos a la prueba.

Los PDF generados pesan menos de 1 KiB, por lo que cumplen el límite provisional de 1 MiB por archivo y 3 MiB en total.

### Si el preflight o la carga devuelve 403/404

- Detén los reintentos de escritura; no cambies a recursos productivos ni hagas público el acceso.
- HTTP 403 puede indicar API deshabilitada, recurso no seleccionado por la aplicación o permiso OAuth insuficiente.
- HTTP 404 al consultar una carpeta puede significar ID equivocado o que la persona propietaria no concedió acceso OAuth a ese recurso.
- Comprueba por separado el acceso OAuth a la hoja y carpeta seleccionadas. No compartas IDs, correos, respuestas JSON completas ni URLs al reportar el resultado.
- Reanuda el test de escritura únicamente después de que el preflight confirme hoja y carpeta accesibles para OAuth del servidor.

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
- Desde el PR #26, el adapter real reserva el identificador mediante una
  transacción Firestore antes de leer Sheets o subir archivos. La reserva
  persistente está implementada; las unitarias inyectan una reserva en memoria,
  por lo que no prueban Firestore real ni múltiples instancias de Vercel.
- La existencia del test remoto no demuestra su ejecución: se omite si
  `RUN_GOOGLE_SANDBOX_INTEGRATION` no es `true`. Separar evidencia mock,
  ejecución autorizada contra Google y concurrencia HTTP real de staging.
- El test remoto envía dos solicitudes simultáneas y un reintento posterior. Sólo una solicitud concurrente puede recibir `SAVED`; una segunda puede recibir `DUPLICATE` o una respuesta recuperable de “en proceso”, y el reintento posterior debe ser `DUPLICATE`. No declara verificados Picker ni selección de recursos.
- Una reserva en estado `recovery-required` o `processing` tras una caída debe investigarse antes de eliminarse. Primero verifica Sheets y Drive del sandbox para ese ID; sólo elimina la reserva después de reconciliar o limpiar la fila y archivos.
- Si Drive confirma una carga pero se pierde la respuesta antes de recibir su ID, el cleanup automático no puede identificar ese archivo; revisa el sandbox después de una falla remota.
- El modo mock no prueba credenciales, cuota, permisos efectivos ni disponibilidad de Google.
- Nada de esta guía habilita producción o el procesamiento de datos reales.

## Conservar los datos ficticios de la prueba de integración

Con `SANDBOX_GOOGLE_CONSERVAR=true` la prueba no borra su fila, sus tres archivos ni su reserva, para inspeccionar la hoja `Vista CROFI`. Es sólo para el sandbox propio con datos ficticios. Después hay que eliminar a mano la fila (la del ID técnico de prueba), los tres archivos de la carpeta de pruebas y, si se desea repetir la prueba, la reserva en Firestore.

## Prueba opt-in de concurrencia real

Archivo: `src/lib/google/concurrencia.integration.test.ts`. Sólo corre en el sandbox propio autorizado, con datos ficticios. No sustituye al mock en memoria: cada «instancia» usa su propio cliente Firestore, adapter y handler.

Comando:

```bash
RUN_GOOGLE_SANDBOX_CONCURRENCIA=true SANDBOX_GOOGLE_FILE_TEST_AUTHORIZED=true pnpm sandbox:concurrencia
```

Variables opcionales: `SANDBOX_CONCURRENCIA_MISMO_ID` (defecto 5, máx. 10), `SANDBOX_CONCURRENCIA_ENVIOS` (defecto 5, máx. 500) y `SANDBOX_CONCURRENCIA_INSTANCIAS` (defecto 5, máx. 10). Escalar de forma gradual (5, 20, 100, 200 y, sólo si la anterior fue estable, 500).

Se afirma: con el mismo ID hay a lo sumo una fila y un SAVED, y fila implica tres archivos; con IDs distintos cada SAVED tiene una fila, tres archivos y folio correcto, y los folios son únicos. Se mide (sin afirmar): duración, p50/p95, códigos, estados y métricas de llamadas, incluidos 429 o timeouts. Al terminar se limpian filas, archivos y reservas con prefijo `qa-conc-`. Registrar sólo conteos y fecha, nunca IDs ni URLs.

Limpieza: barre todo lo que tenga prefijo `qa-conc-` (filas, archivos y reservas), reintenta ante 429 esperando 65 s y cada paso es independiente. Si una corrida dejó restos, ejecutar sólo la limpieza con `SANDBOX_CONCURRENCIA_SOLO_LIMPIAR=true` más las dos variables de autorización.
