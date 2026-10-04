import { useEffect, useRef, useState } from 'react';

interface Props {
  clientId: string;
  apiKey: string;
  projectNumber: string;
}

interface OAuthTokenResponse {
  access_token?: string;
  error?: string;
}

interface OAuthTokenClient {
  requestAccessToken(options?: { prompt?: string }): void;
}

interface GooglePickerWindow extends Window {
  gapi?: {
    load(name: string, callback: () => void): void;
  };
  google?: typeof google & {
    accounts?: {
      oauth2?: {
        initTokenClient(options: {
          client_id: string;
          scope: string;
          callback(response: OAuthTokenResponse): void;
        }): OAuthTokenClient;
      };
    };
  };
}

type SelectedResource = 'spreadsheet' | 'folder';
type PickedResource = { id: string; kind: SelectedResource };

function loadGoogleScript(id: string, source: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById(
      id,
    ) as HTMLScriptElement | null;
    if (existingScript?.dataset.loaded === 'true') {
      resolve();
      return;
    }

    const script = existingScript ?? document.createElement('script');
    script.id = id;
    script.async = true;
    script.src = source;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () =>
      reject(new Error('No se pudo cargar Google Picker.'));
    if (!existingScript) document.head.append(script);
  });
}

export default function SandboxGooglePicker({
  clientId,
  apiKey,
  projectNumber,
}: Props) {
  const [ready, setReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedResources, setSelectedResources] = useState<
    Partial<Record<SelectedResource, PickedResource>>
  >({});
  const tokenClientRef = useRef<OAuthTokenClient | null>(null);
  const accessTokenRef = useRef<string | null>(null);
  const pendingSelectionRef = useRef<SelectedResource | null>(null);

  useEffect(() => {
    let disposed = false;

    async function initializePicker() {
      const googleWindow = window as GooglePickerWindow;
      try {
        const scripts: Promise<void>[] = [];
        if (!googleWindow.gapi) {
          scripts.push(
            loadGoogleScript(
              'google-api-loader',
              'https://apis.google.com/js/api.js',
            ),
          );
        }
        if (!googleWindow.google?.accounts?.oauth2) {
          scripts.push(
            loadGoogleScript(
              'google-identity-services',
              'https://accounts.google.com/gsi/client',
            ),
          );
        }
        await Promise.all(scripts);

        if (disposed) return;
        const gapi = googleWindow.gapi;
        const tokenClient = googleWindow.google?.accounts?.oauth2;
        if (!gapi || !tokenClient) {
          throw new Error('Google Picker no quedó disponible.');
        }

        tokenClientRef.current = tokenClient.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/drive.file',
          callback: (response) => {
            const kind = pendingSelectionRef.current;
            pendingSelectionRef.current = null;

            if (response.error || !response.access_token || !kind) {
              setErrorMessage(
                'Google no concedió autorización para esta selección. Revisa que la cuenta sea test user.',
              );
              return;
            }

            accessTokenRef.current = response.access_token;
            const pickerApi = googleWindow.google?.picker;
            if (!pickerApi) {
              setErrorMessage('La biblioteca de Google Picker no está lista.');
              return;
            }

            const view =
              kind === 'spreadsheet'
                ? new pickerApi.DocsView(pickerApi.ViewId.SPREADSHEETS).setMode(
                    pickerApi.DocsViewMode.LIST,
                  )
                : new pickerApi.DocsView(pickerApi.ViewId.FOLDERS)
                    .setIncludeFolders(true)
                    .setSelectFolderEnabled(true)
                    .setMode(pickerApi.DocsViewMode.LIST);

            const picker = new pickerApi.PickerBuilder()
              .addView(view)
              .setOAuthToken(response.access_token)
              .setDeveloperKey(apiKey)
              .setAppId(projectNumber)
              .setMaxItems(1)
              .setCallback((result) => {
                const action = result[pickerApi.Response.ACTION];
                if (action === pickerApi.Action.CANCEL) {
                  setStatusMessage('Selección cancelada.');
                  return;
                }
                if (action !== pickerApi.Action.PICKED) return;

                const picked = result[pickerApi.Response.DOCUMENTS]?.[0];
                const id = picked?.[pickerApi.Document.ID];
                if (!id) {
                  setErrorMessage('Google Picker no devolvió un archivo.');
                  return;
                }

                setSelectedResources((current) => ({
                  ...current,
                  [kind]: { id, kind },
                }));
                setErrorMessage('');
                setStatusMessage(
                  kind === 'spreadsheet'
                    ? 'Hoja seleccionada. Copia su ID al entorno local.'
                    : 'Carpeta seleccionada. Copia su ID al entorno local.',
                );
              })
              .build();
            picker.setVisible(true);
          },
        });

        gapi.load('picker', () => {
          if (!disposed) setReady(true);
        });
      } catch {
        if (!disposed) {
          setErrorMessage(
            'No se pudieron cargar los componentes de Google. Comprueba tu conexión.',
          );
        }
      }
    }

    void initializePicker();
    return () => {
      disposed = true;
      accessTokenRef.current = null;
    };
  }, [apiKey, clientId, projectNumber]);

  function requestSelection(kind: SelectedResource) {
    if (!tokenClientRef.current) {
      setErrorMessage('El selector aún se está preparando.');
      return;
    }

    setErrorMessage('');
    pendingSelectionRef.current = kind;
    tokenClientRef.current.requestAccessToken({
      prompt: accessTokenRef.current ? '' : 'consent',
    });
  }

  async function copySelectedId(kind: SelectedResource) {
    const selected = selectedResources[kind];
    if (!selected) return;

    try {
      await navigator.clipboard.writeText(selected.id);
      setStatusMessage(
        `ID de ${kind === 'spreadsheet' ? 'la hoja' : 'la carpeta'} copiado. Pégalo localmente en .env; no lo compartas.`,
      );
    } catch {
      setErrorMessage(
        'El navegador no permitió copiar el ID. Revisa el permiso del portapapeles en localhost.',
      );
    }
  }

  return (
    <section aria-labelledby="picker-title" className="stack">
      <h1 id="picker-title">Seleccionar recursos del sandbox</h1>
      <p>
        Usa la cuenta autorizada de Sebastián. El permiso solicitado para cada
        selección es sólo <code>drive.file</code>; el token temporal se mantiene
        en memoria y no se guarda en el navegador.
      </p>

      <div className="cluster">
        <button
          type="button"
          className="button"
          disabled={!ready}
          onClick={() => requestSelection('spreadsheet')}
        >
          Seleccionar hoja
        </button>
        <button
          type="button"
          className="button button--secondary"
          disabled={!ready}
          onClick={() => requestSelection('folder')}
        >
          Seleccionar carpeta
        </button>
      </div>

      <ul>
        <li>
          Hoja: {selectedResources.spreadsheet ? 'seleccionada' : 'pendiente'}
          <button
            type="button"
            className="button button--secondary"
            disabled={!selectedResources.spreadsheet}
            onClick={() => void copySelectedId('spreadsheet')}
          >
            Copiar ID de hoja
          </button>
        </li>
        <li>
          Carpeta: {selectedResources.folder ? 'seleccionada' : 'pendiente'}
          <button
            type="button"
            className="button button--secondary"
            disabled={!selectedResources.folder}
            onClick={() => void copySelectedId('folder')}
          >
            Copiar ID de carpeta
          </button>
        </li>
      </ul>

      {statusMessage && <p role="status">{statusMessage}</p>}
      {errorMessage && <p role="alert">{errorMessage}</p>}
    </section>
  );
}
