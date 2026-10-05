import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  renameSync,
} from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { createConnection } from 'node:net';
import { parse } from 'dotenv';
import { google } from 'googleapis';

const scope = 'https://www.googleapis.com/auth/drive.file';
const redirect = 'http://localhost:4338/oauth/callback';
const configFile = resolve('.private/google-sandbox-local.env');
const args = process.argv.slice(2);
const value = (flag) => args[args.indexOf(flag) + 1];
const readConfig = () =>
  existsSync(configFile) ? parse(readFileSync(configFile)) : {};
const config = readConfig();

function saveConfig() {
  mkdirSync(resolve('.private'), { recursive: true, mode: 0o700 });
  const temporary = configFile + '.tmp';
  writeFileSync(
    temporary,
    Object.entries(config)
      .map(([key, data]) => key + '=' + JSON.stringify(data))
      .join('\n') + '\n',
    { mode: 0o600 },
  );
  renameSync(temporary, configFile);
}

function missing(keys) {
  return keys.filter((key) => !config[key]?.trim());
}

function oauthClient() {
  const client = new google.auth.OAuth2(
    config.SANDBOX_GOOGLE_OAUTH_CLIENT_ID,
    config.SANDBOX_GOOGLE_OAUTH_CLIENT_SECRET,
    redirect,
  );
  client.setCredentials({
    refresh_token: config.SANDBOX_GOOGLE_OAUTH_REFRESH_TOKEN,
  });
  return client;
}

async function checkScope(client) {
  const result = await client.getAccessToken();
  if (!result.token) throw new Error('Google no devolvió token.');
  const info = await client.getTokenInfo(result.token);
  if (info.scopes.length !== 1 || info.scopes[0] !== scope) {
    throw new Error(
      'Se requiere únicamente drive.file; no se guardará un token con acceso amplio.',
    );
  }
}

async function preflight() {
  const absent = missing([
    'SANDBOX_GOOGLE_OAUTH_CLIENT_ID',
    'SANDBOX_GOOGLE_OAUTH_CLIENT_SECRET',
    'SANDBOX_GOOGLE_OAUTH_REFRESH_TOKEN',
    'SANDBOX_GOOGLE_SPREADSHEET_ID',
    'SANDBOX_GOOGLE_DRIVE_FOLDER_ID',
    'SANDBOX_GOOGLE_ROOT_FOLDER_ID',
  ]);
  if (absent.length)
    throw new Error('Falta configuración local: ' + absent.join(', '));
  const auth = oauthClient();
  await checkScope(auth);
  const drive = google.drive({ version: 'v3', auth });
  for (const [key, mime] of [
    ['SANDBOX_GOOGLE_ROOT_FOLDER_ID', 'application/vnd.google-apps.folder'],
    ['SANDBOX_GOOGLE_DRIVE_FOLDER_ID', 'application/vnd.google-apps.folder'],
    [
      'SANDBOX_GOOGLE_SPREADSHEET_ID',
      'application/vnd.google-apps.spreadsheet',
    ],
  ]) {
    const { data } = await drive.files.get({
      fileId: config[key],
      fields: 'mimeType,trashed,parents,capabilities(canEdit)',
    });
    if (data.mimeType !== mime || data.trashed || !data.capabilities?.canEdit) {
      throw new Error(
        'Recurso sandbox inválido o sin permiso de escritura: ' + key,
      );
    }
    if (
      key !== 'SANDBOX_GOOGLE_ROOT_FOLDER_ID' &&
      !data.parents?.includes(config.SANDBOX_GOOGLE_ROOT_FOLDER_ID)
    ) {
      throw new Error(
        'El recurso no pertenece a la raíz de sandbox autorizada.',
      );
    }
    const { data: permissions } = await drive.permissions.list({
      fileId: config[key],
      fields: 'permissions(type)',
      pageSize: 100,
    });
    if (
      permissions.permissions?.some(
        (p) => p.type === 'anyone' || p.type === 'domain',
      )
    ) {
      throw new Error(
        'El sandbox tiene permisos públicos o de dominio; se cancela la prueba.',
      );
    }
  }
  const sheets = google.sheets({ version: 'v4', auth });
  const { data } = await sheets.spreadsheets.get({
    spreadsheetId: config.SANDBOX_GOOGLE_SPREADSHEET_ID,
    fields: 'sheets(properties(title))',
  });
  if (!data.sheets?.some((sheet) => sheet.properties?.title === 'Registros')) {
    throw new Error(
      'La pestaña Registros no existe; no se escribirá en otra hoja.',
    );
  }
  const headers = await sheets.spreadsheets.values.get({
    spreadsheetId: config.SANDBOX_GOOGLE_SPREADSHEET_ID,
    range: 'Registros!A1:R1',
  });
  const expected = [
    'transactionId',
    'nombreEquipo',
    'categoria',
    'institucion',
    'estadoCiudadProcedencia',
    'nombreCapitan',
    'correoCapitan',
    'telefonoCapitan',
    'identificacionInstitucional',
    'integrantes',
    'nombreRobot',
    'descripcionRobot',
    'aceptaReglamento',
    'aceptaUsoImagen',
    'confirmaRestriccionesCategoria',
    'archivoIdentificacion',
    'comprobantePago',
    'cartaResponsiva',
  ];
  if (JSON.stringify(headers.data.values?.[0]) !== JSON.stringify(expected)) {
    throw new Error(
      'Los encabezados no coinciden con el contrato de 18 columnas.',
    );
  }
  console.log(
    'OAuth drive.file, recursos privados y encabezados: OK. No se escribió Google.',
  );
}

if (args.includes('--resources')) {
  const source = readFileSync(resolve(value('--resources')), 'utf8');
  const root =
    /\[carpeta raíz\]\(https:\/\/drive\.google\.com\/drive\/folders\/([A-Za-z0-9_-]+)\)/.exec(
      source,
    )?.[1];
  const folder =
    /\[documentos ficticios\]\(https:\/\/drive\.google\.com\/drive\/folders\/([A-Za-z0-9_-]+)\)/.exec(
      source,
    )?.[1];
  const sheet =
    /\[hoja Registros\]\(https:\/\/docs\.google\.com\/spreadsheets\/d\/([A-Za-z0-9_-]+)/.exec(
      source,
    )?.[1];
  if (!root || !folder || !sheet)
    throw new Error(
      'No se pudo identificar el inventario autorizado de sandbox.',
    );
  config.SANDBOX_GOOGLE_ROOT_FOLDER_ID = root;
  config.SANDBOX_GOOGLE_DRIVE_FOLDER_ID = folder;
  config.SANDBOX_GOOGLE_SPREADSHEET_ID = sheet;
  config.SANDBOX_GOOGLE_SHEET_RANGE = 'Registros!A:R';
}

if (args.includes('--firestore-key')) {
  const key = JSON.parse(
    readFileSync(resolve(value('--firestore-key')), 'utf8'),
  );
  if (
    key.type !== 'service_account' ||
    !key.project_id ||
    !key.client_email ||
    !key.private_key
  ) {
    throw new Error('El archivo no contiene una credencial Firestore válida.');
  }
  config.SANDBOX_FIRESTORE_PROJECT_ID = key.project_id;
  config.SANDBOX_FIRESTORE_CLIENT_EMAIL = key.client_email;
  config.SANDBOX_FIRESTORE_PRIVATE_KEY = key.private_key;
  saveConfig();
  console.log(
    'Credencial guardada sólo en configuración local privada; permisos aún requieren preflight.',
  );
}

if (args.includes('--authorize')) {
  const web = JSON.parse(readFileSync(resolve(value('--client')), 'utf8')).web;
  if (!web?.redirect_uris?.includes(redirect))
    throw new Error('Registra primero el callback local exacto de la guía.');
  config.SANDBOX_GOOGLE_OAUTH_CLIENT_ID = web.client_id;
  config.SANDBOX_GOOGLE_OAUTH_CLIENT_SECRET = web.client_secret;
  const client = oauthClient();
  let pending = null;
  const server = createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; frame-ancestors 'none'",
    );
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    if (
      req.headers.host !== 'localhost:4338' ||
      req.method !== 'GET' ||
      req.headers.forwarded ||
      req.headers['x-forwarded-for']
    ) {
      res.writeHead(403);
      res.end('Acceso local requerido.');
      return;
    }
    const url = new URL(req.url, redirect);
    if (url.pathname === '/') {
      res.end(
        '<h1>Copa Ollin · autorizar sandbox local</h1><p>Usa sólo tu cuenta autorizada. Se solicitará únicamente drive.file; no se muestran secretos ni se suben documentos.</p><a href="/oauth/start">Autorizar con Google</a>',
      );
      return;
    }
    if (url.pathname === '/oauth/start') {
      pending = {
        state: randomBytes(32).toString('hex'),
        createdAt: Date.now(),
      };
      res.setHeader(
        'Set-Cookie',
        'sandbox-oauth-state=' +
          pending.state +
          '; HttpOnly; SameSite=Lax; Path=/oauth; Max-Age=600',
      );
      res.writeHead(302, {
        Location: client.generateAuthUrl({
          scope: [scope],
          access_type: 'offline',
          prompt: 'consent',
          include_granted_scopes: false,
          state: pending.state,
        }),
      });
      res.end();
      return;
    }
    if (url.pathname !== '/oauth/callback') {
      res.writeHead(404);
      res.end('Ruta no disponible.');
      return;
    }
    const state = url.searchParams.get('state');
    const cookie = /(?:^|; )sandbox-oauth-state=([a-f0-9]+)/.exec(
      req.headers.cookie ?? '',
    )?.[1];
    if (
      !pending ||
      Date.now() - pending.createdAt > 600000 ||
      state !== pending.state ||
      cookie !== pending.state
    ) {
      res.writeHead(403);
      res.end('Sesión inválida o vencida; vuelve al inicio.');
      return;
    }
    pending = null;
    res.setHeader(
      'Set-Cookie',
      'sandbox-oauth-state=; HttpOnly; SameSite=Lax; Path=/oauth; Max-Age=0',
    );
    try {
      const code = url.searchParams.get('code');
      if (!code || url.searchParams.has('error'))
        throw new Error('Consentimiento cancelado.');
      const { tokens } = await client.getToken(code);
      if (!tokens.refresh_token)
        throw new Error('Google no emitió refresh token.');
      client.setCredentials(tokens);
      await checkScope(client);
      config.SANDBOX_GOOGLE_OAUTH_REFRESH_TOKEN = tokens.refresh_token;
      config.SANDBOX_REGISTRATION_TOKEN ??= randomBytes(32).toString('hex');
      saveConfig();
      res.end(
        '<h1>OAuth guardado localmente</h1><p>Scope único drive.file. Credenciales privadas fuera de Git. No se han cargado documentos; falta verificar recursos y Firestore.</p>',
      );
      console.log(
        'OAuth renovado y guardado localmente. No se imprimen credenciales.',
      );
    } catch {
      res.writeHead(400);
      res.end(
        'No se pudo autorizar con scope único drive.file. Reintenta desde el inicio; no pegues tokens en el chat.',
      );
      console.log('Autorización no completada; no se publicaron credenciales.');
    }
  });
  server.listen(4338, '127.0.0.1', () =>
    console.log('Abre http://localhost:4338 para autorizar.'),
  );
} else if (args.includes('--preflight') || args.includes('--serve')) {
  try {
    await preflight();
    if (args.includes('--serve')) {
      const absent = missing([
        'SANDBOX_FIRESTORE_PROJECT_ID',
        'SANDBOX_FIRESTORE_CLIENT_EMAIL',
        'SANDBOX_FIRESTORE_PRIVATE_KEY',
      ]);
      if (absent.length)
        throw new Error(
          'Falta la credencial Firestore del proyecto de pruebas; no se desactivará idempotencia.',
        );
      const { Firestore } = await import('@google-cloud/firestore');
      const firestore = new Firestore({
        projectId: config.SANDBOX_FIRESTORE_PROJECT_ID,
        credentials: {
          client_email: config.SANDBOX_FIRESTORE_CLIENT_EMAIL,
          private_key: config.SANDBOX_FIRESTORE_PRIVATE_KEY.replace(
            /\\n/g,
            '\n',
          ),
        },
      });
      try {
        await firestore
          .collection('sandboxRegistrationReservations')
          .limit(1)
          .get();
      } finally {
        await firestore.terminate();
      }
      const portOccupied = await new Promise((resolvePort) => {
        const socket = createConnection({ host: '127.0.0.1', port: 4321 });
        socket.once('connect', () => {
          socket.destroy();
          resolvePort(true);
        });
        socket.once('error', () => resolvePort(false));
      });
      if (portOccupied) {
        throw new Error(
          'Detén el Astro local existente antes de activar Google real.',
        );
      }
      const child = spawn(
        'pnpm',
        ['dev', '--host', '127.0.0.1', '--port', '4321'],
        {
          stdio: ['ignore', 'ignore', 'ignore'],
          env: {
            ...process.env,
            ...config,
            ASTRO_DEV_BACKGROUND: '0',
            REGISTRO_SANDBOX_MODE: 'true',
            ENABLE_SANDBOX_REGISTRATION: 'true',
            USE_MOCK_GOOGLE: 'false',
            ENABLE_REAL_GOOGLE_SANDBOX: 'true',
            LOCAL_SANDBOX_BROWSER_AUTH: 'true',
          },
        },
      );
      child.on('error', () => console.error('No se pudo iniciar Astro.'));
      child.on('exit', (code) => {
        process.exitCode = code ?? 1;
      });
      console.log(
        'Iniciando Astro con Google real en loopback; usa únicamente PDF y datos ficticios. Si Astro no inicia, no se puede declarar la prueba lista.',
      );
    }
  } catch {
    console.error(
      'Preflight incompleto: revisa consentimiento, recursos seleccionados, encabezados y credencial Firestore. No se escribió Google ni se habilitó el servidor real.',
    );
    process.exitCode = 1;
  }
} else {
  console.log(
    'Usa --authorize --client <JSON privado> --resources <inventario privado>, --preflight o --serve.',
  );
}
