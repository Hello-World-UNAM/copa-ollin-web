import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useFieldArray, useForm, type SubmitHandler } from 'react-hook-form';
import { ESTADOS_MX, buscarEstado } from '../../lib/registro/estados';
import { categories } from '../../data/categories';
import {
  ACCEPT_DOCUMENTO,
  CAMPOS_ARCHIVO,
  DOCUMENTOS,
  MAX_ARCHIVO_BYTES,
  MAX_TOTAL_ARCHIVOS_BYTES,
  formatearBytes,
  validarArchivoDocumento,
  validarTotalArchivos,
  type CampoArchivo,
} from '../../lib/registro/contract';
import {
  TIPOS_INCIERTOS,
  crearSesionEnvio,
  enviarRegistro,
  MENSAJES_ENVIO,
  type ResultadoEnvio,
} from '../../lib/registro/envio';
import {
  construirFormData,
  type ArchivosRegistro,
} from '../../lib/registro/formData';
import {
  registroDefaultValues,
  registroSchema,
  type RegistroPayload,
} from '../../lib/registro/schema';

const pasos = [
  { id: 'equipo', titulo: 'Equipo y categoría' },
  { id: 'capitan', titulo: 'Capitán e integrantes' },
  { id: 'robot', titulo: 'Robot' },
  { id: 'documentos', titulo: 'Documentos y consentimientos' },
  { id: 'revision', titulo: 'Revisión' },
] as const;

type PasoId = (typeof pasos)[number]['id'];

const camposPorPaso: Record<PasoId, (keyof RegistroPayload)[]> = {
  equipo: [
    'nombreEquipo',
    'categoria',
    'institucion',
    'estadoCiudadProcedencia',
  ],
  capitan: [
    'nombreCapitan',
    'correoCapitan',
    'telefonoCapitan',
    'identificacionInstitucional',
    'integrantes',
  ],
  robot: ['nombreRobot', 'descripcionRobot'],
  documentos: [
    'aceptaReglamento',
    'aceptaUsoImagen',
    'confirmaRestriccionesCategoria',
  ],
  revision: [],
};

const ETIQUETAS_CAMPOS: Record<string, string> = {
  nombreEquipo: 'Nombre del equipo',
  categoria: 'Categoría',
  institucion: 'Institución educativa',
  estadoCiudadProcedencia: 'Estado o ciudad de procedencia',
  nombreCapitan: 'Nombre del capitán',
  correoCapitan: 'Correo del capitán',
  telefonoCapitan: 'Teléfono',
  identificacionInstitucional: 'Identificación institucional',
  integrantes: 'Integrantes',
  nombreRobot: 'Nombre del robot',
  descripcionRobot: 'Descripción del robot',
  aceptaReglamento: 'Aceptación del reglamento',
  aceptaUsoImagen: 'Uso de fotografías y material audiovisual',
  confirmaRestriccionesCategoria: 'Restricciones de la categoría',
  archivoIdentificacion: 'Identificación del capitán',
  comprobantePago: 'Comprobante de pago',
  cartaResponsiva: 'Carta responsiva',
  archivos: 'Tamaño total de los archivos',
};

const esCampoArchivo = (campo: string): campo is CampoArchivo =>
  (CAMPOS_ARCHIVO as readonly string[]).includes(campo);

function pasoDeCampo(campo: string): PasoId | undefined {
  if (esCampoArchivo(campo) || campo === 'archivos') return 'documentos';
  return pasos.find((paso) =>
    (camposPorPaso[paso.id] as string[]).includes(campo),
  )?.id;
}

type ErroresArchivo = Partial<Record<CampoArchivo, string>>;

type EstadoEnvio =
  | { estado: 'inactivo' }
  | { estado: 'enviando' }
  | { estado: 'resultado'; resultado: ResultadoEnvio; transactionId: string };

function combinarRefs<T>(
  refRegistro: (instancia: T | null) => void,
  refExterno: React.MutableRefObject<T | null>,
) {
  return (instancia: T | null) => {
    refRegistro(instancia);
    refExterno.current = instancia;
  };
}

/** Huella de datos y documentos enviados, para detectar cambios tras un envío incierto. */
function calcularHuella(
  payload: RegistroPayload,
  archivos: ArchivosRegistro,
): string {
  return JSON.stringify([
    payload,
    Object.entries(archivos).map(([campo, archivo]) => [
      campo,
      archivo.name,
      archivo.size,
      archivo.type,
      archivo.lastModified,
    ]),
  ]);
}

export default function RegistroForm() {
  const [pasoActual, setPasoActual] = useState<PasoId>('equipo');
  const [envio, setEnvio] = useState<EstadoEnvio>({ estado: 'inactivo' });
  const [archivos, setArchivos] = useState<Partial<ArchivosRegistro>>({});
  const [erroresArchivo, setErroresArchivo] = useState<ErroresArchivo>({});
  const [errorTotal, setErrorTotal] = useState<string | null>(null);
  const [avisoTelefono, setAvisoTelefono] = useState(false);
  const [folioCopiado, setFolioCopiado] = useState('');
  const [sesion] = useState(() => crearSesionEnvio());

  const enviandoRef = useRef(false);
  const huellaIncierta = useRef<string | null>(null);
  const anuncioRef = useRef<HTMLDivElement>(null);
  const primerCampoRef = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    trigger,
    getValues,
    setValue,
    reset,
    setError,
    formState: { errors },
  } = useForm<RegistroPayload>({
    resolver: zodResolver(registroSchema),
    defaultValues: registroDefaultValues,
    mode: 'onBlur',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'integrantes',
  });

  const indicePaso = pasos.findIndex((paso) => paso.id === pasoActual);
  const pasoInfo = pasos[indicePaso];

  const { ref: nombreEquipoRef, ...nombreEquipoRegistro } =
    register('nombreEquipo');
  const { ref: nombreCapitanRef, ...nombreCapitanRegistro } =
    register('nombreCapitan');
  const { ref: nombreRobotRef, ...nombreRobotRegistro } =
    register('nombreRobot');
  const { onChange: onChangeTelefono, ...telefonoRegistro } =
    register('telefonoCapitan');
  const { onBlur: onBlurEstado, ...estadoRegistro } = register(
    'estadoCiudadProcedencia',
  );

  function anunciar(texto: string) {
    if (anuncioRef.current) anuncioRef.current.textContent = texto;
  }

  useEffect(() => {
    if (pasoInfo) {
      anunciar(
        `Paso ${indicePaso + 1} de ${pasos.length}: ${pasoInfo.titulo}.`,
      );
    }
    primerCampoRef.current?.focus();
  }, [pasoActual, indicePaso, pasoInfo]);

  // --- Archivos (viven en estado: sobreviven al cambio de paso y a un fallo) ---

  async function alSeleccionarArchivo(
    campo: CampoArchivo,
    input: HTMLInputElement,
  ) {
    const archivo = input.files?.[0];
    if (!archivo) return;
    const error = await validarArchivoDocumento(campo, archivo);
    setErroresArchivo((previos) => ({
      ...previos,
      [campo]: error ?? undefined,
    }));
    // Un reemplazo inválido nunca sustituye al archivo válido anterior.
    if (!error) setArchivos((previos) => ({ ...previos, [campo]: archivo }));
    // El estado es la fuente de verdad: se limpia el input para poder
    // volver a elegir el mismo archivo.
    input.value = '';
  }

  function quitarArchivo(campo: CampoArchivo) {
    setArchivos((previos) => ({ ...previos, [campo]: undefined }));
    setErroresArchivo((previos) => ({ ...previos, [campo]: undefined }));
    requestAnimationFrame(() =>
      document.getElementById(`documento-${campo}`)?.focus(),
    );
  }

  function validarDocumentosRequeridos(): ArchivosRegistro | null {
    const faltantes: ErroresArchivo = {};
    for (const { campo } of DOCUMENTOS) {
      if (!archivos[campo])
        faltantes[campo] = 'Selecciona un archivo para este documento.';
    }
    setErroresArchivo(faltantes);

    const { archivoIdentificacion, comprobantePago, cartaResponsiva } =
      archivos;
    if (!archivoIdentificacion || !comprobantePago || !cartaResponsiva)
      return null;

    const completos = {
      archivoIdentificacion,
      comprobantePago,
      cartaResponsiva,
    };
    const total = validarTotalArchivos(Object.values(completos));
    setErrorTotal(total);
    return total ? null : completos;
  }

  // --- Navegación ---

  async function irAlSiguientePaso() {
    let valido = await trigger(camposPorPaso[pasoActual], {
      shouldFocus: true,
    });
    if (pasoActual === 'documentos') {
      valido = validarDocumentosRequeridos() !== null && valido;
    }
    if (!valido) return;
    const siguiente = pasos[indicePaso + 1];
    if (siguiente) setPasoActual(siguiente.id);
  }

  function irAlPasoAnterior() {
    const anterior = pasos[indicePaso - 1];
    if (anterior) setPasoActual(anterior.id);
  }

  // --- Envío ---

  function aplicarErroresDelServidor(campos: string[]) {
    const indices: number[] = [];
    for (const campo of campos) {
      const paso = pasoDeCampo(campo);
      if (paso) indices.push(pasos.findIndex((p) => p.id === paso));
      if (esCampoArchivo(campo)) {
        setErroresArchivo((previos) => ({
          ...previos,
          [campo]:
            'El servidor no aceptó este archivo. Reemplázalo por otro documento válido.',
        }));
      } else if (campo in registroDefaultValues) {
        setError(campo as keyof RegistroPayload, {
          type: 'server',
          message: 'El servidor no aceptó este dato. Revísalo.',
        });
      }
    }
    const primero = pasos[Math.min(...indices)];
    if (primero) setPasoActual(primero.id);
  }

  const onSubmit: SubmitHandler<RegistroPayload> = async (payload) => {
    if (enviandoRef.current) return; // evita doble clic / doble Enter
    const completos = validarDocumentosRequeridos();
    if (!completos) {
      setPasoActual('documentos');
      return;
    }

    const transactionId = sesion.obtenerTransactionId();
    const huella = calcularHuella(payload, completos);
    if (huellaIncierta.current && huellaIncierta.current !== huella) {
      // Mismo identificador con datos distintos tras un envío incierto:
      // no se envía nada para no duplicar ni contradecir un guardado posible.
      setEnvio({
        estado: 'resultado',
        resultado: { tipo: 'datos_modificados' },
        transactionId,
      });
      return;
    }

    enviandoRef.current = true;
    setEnvio({ estado: 'enviando' });
    anunciar('Enviando registro de prueba.');
    try {
      const resultado = await enviarRegistro(
        construirFormData(payload, completos, transactionId),
      );
      huellaIncierta.current = TIPOS_INCIERTOS.has(resultado.tipo)
        ? huella
        : null;
      setEnvio({ estado: 'resultado', resultado, transactionId });
      if (resultado.tipo === 'validacion')
        aplicarErroresDelServidor(resultado.campos);
    } catch {
      huellaIncierta.current = huella;
      setEnvio({
        estado: 'resultado',
        resultado: { tipo: 'interno' },
        transactionId,
      });
    } finally {
      enviandoRef.current = false;
    }
  };

  function reiniciarFormulario() {
    reset(registroDefaultValues);
    setArchivos({});
    setErroresArchivo({});
    setErrorTotal(null);
    setAvisoTelefono(false);
    setFolioCopiado('');
    huellaIncierta.current = null;
    sesion.reiniciar();
    setEnvio({ estado: 'inactivo' });
    setPasoActual('equipo');
  }

  async function copiarFolio(folio: string) {
    try {
      await navigator.clipboard.writeText(folio);
      setFolioCopiado('Folio copiado.');
    } catch {
      setFolioCopiado(
        'No se pudo copiar automáticamente. Selecciona el folio y cópialo manualmente.',
      );
    }
  }

  const resultado = envio.estado === 'resultado' ? envio.resultado : null;

  if (
    envio.estado === 'resultado' &&
    (resultado?.tipo === 'exito' || resultado?.tipo === 'duplicado')
  ) {
    const mensaje = MENSAJES_ENVIO[resultado.tipo];
    const folio = resultado.folio;
    return (
      <div role="status" className="card registro-confirmacion">
        <p className="eyebrow">Sandbox de prueba</p>
        <h2>{mensaje.titulo}</h2>
        <p>{mensaje.detalle}</p>
        {folio && (
          <>
            <p>Guarda este folio:</p>
            <p>
              <strong className="registro-folio">{folio}</strong>
            </p>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => void copiarFolio(folio)}
            >
              Copiar folio
            </button>
            <p aria-live="polite">{folioCopiado}</p>
          </>
        )}
        <p>
          Identificador técnico de prueba:{' '}
          <strong>{envio.transactionId}</strong>
        </p>
        <button
          type="button"
          className="button button--secondary"
          onClick={reiniciarFormulario}
        >
          Registrar otro envío de prueba
        </button>
      </div>
    );
  }

  const valores = pasoActual === 'revision' ? getValues() : null;
  const si = (valor: boolean) => (valor ? 'Sí' : 'No');

  return (
    <form
      className="registro-form"
      noValidate
      onKeyDown={(event) => {
        if (
          event.key === 'Enter' &&
          event.target instanceof HTMLInputElement &&
          event.target.type !== 'checkbox' &&
          event.target.type !== 'submit' &&
          event.target.type !== 'button'
        ) {
          event.preventDefault();
        }
      }}
      onSubmit={(event) => {
        if (pasoActual !== 'revision') {
          event.preventDefault();
          void irAlSiguientePaso();
          return;
        }
        void handleSubmit(onSubmit)(event);
      }}
    >
      <div aria-live="polite" className="visually-hidden" ref={anuncioRef} />

      <div
        className="registro-barra"
        role="progressbar"
        aria-label="Progreso del registro"
        aria-valuemin={1}
        aria-valuemax={pasos.length}
        aria-valuenow={indicePaso + 1}
        aria-valuetext={`Paso ${indicePaso + 1} de ${pasos.length}: ${pasoInfo?.titulo ?? ''}`}
      >
        <div
          className="registro-barra__relleno"
          style={{ width: `${((indicePaso + 1) / pasos.length) * 100}%` }}
        />
      </div>

      <ol className="registro-progreso" aria-label="Secciones del registro">
        {pasos.map((paso, indice) => (
          <li
            key={paso.id}
            aria-current={paso.id === pasoActual ? 'step' : undefined}
            data-completado={indice < indicePaso}
          >
            <span className="registro-progreso__numero">{indice + 1}</span>
            <span className="registro-progreso__titulo">{paso.titulo}</span>
          </li>
        ))}
      </ol>

      {resultado && (
        <div
          role="alert"
          className="registro-resultado registro-resultado--error"
        >
          <strong>{MENSAJES_ENVIO[resultado.tipo].titulo}</strong>
          <p>{MENSAJES_ENVIO[resultado.tipo].detalle}</p>
          {resultado.tipo === 'validacion' && resultado.campos.length > 0 && (
            <ul>
              {resultado.campos.map((campo) => (
                <li key={campo}>{ETIQUETAS_CAMPOS[campo] ?? campo}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {pasoActual === 'equipo' && (
        <fieldset>
          <legend>Equipo y categoría</legend>

          <label htmlFor="nombreEquipo">Nombre del equipo</label>
          <input
            id="nombreEquipo"
            aria-invalid={Boolean(errors.nombreEquipo)}
            ref={combinarRefs(nombreEquipoRef, primerCampoRef)}
            {...nombreEquipoRegistro}
          />
          {errors.nombreEquipo && (
            <p role="alert">{errors.nombreEquipo.message}</p>
          )}

          <label htmlFor="categoria">Categoría</label>
          <select id="categoria" {...register('categoria')}>
            {categories.map((categoria) => (
              <option key={categoria.slug} value={categoria.slug}>
                {categoria.workingName}
              </option>
            ))}
          </select>
          {errors.categoria && <p role="alert">{errors.categoria.message}</p>}

          <label htmlFor="institucion">Institución educativa</label>
          <input
            id="institucion"
            aria-invalid={Boolean(errors.institucion)}
            {...register('institucion')}
          />
          {errors.institucion && (
            <p role="alert">{errors.institucion.message}</p>
          )}

          <label htmlFor="estadoCiudadProcedencia">
            Estado o ciudad de procedencia
          </label>
          <input
            id="estadoCiudadProcedencia"
            list="estados-mx"
            autoComplete="off"
            placeholder="Selecciona o escribe un estado"
            aria-invalid={Boolean(errors.estadoCiudadProcedencia)}
            {...estadoRegistro}
            onBlur={(event) => {
              const oficial = buscarEstado(event.target.value);
              if (oficial) {
                setValue('estadoCiudadProcedencia', oficial, {
                  shouldValidate: true,
                });
              }
              void onBlurEstado(event);
            }}
          />
          <datalist id="estados-mx">
            {ESTADOS_MX.map((estado) => (
              <option key={estado} value={estado} />
            ))}
          </datalist>
          {errors.estadoCiudadProcedencia && (
            <p role="alert">{errors.estadoCiudadProcedencia.message}</p>
          )}
        </fieldset>
      )}

      {pasoActual === 'capitan' && (
        <fieldset>
          <legend>Capitán e integrantes</legend>

          <label htmlFor="nombreCapitan">
            Nombre completo del capitán o capitana
          </label>
          <input
            id="nombreCapitan"
            aria-invalid={Boolean(errors.nombreCapitan)}
            ref={combinarRefs(nombreCapitanRef, primerCampoRef)}
            {...nombreCapitanRegistro}
          />
          {errors.nombreCapitan && (
            <p role="alert">{errors.nombreCapitan.message}</p>
          )}

          <label htmlFor="correoCapitan">Correo electrónico</label>
          <input
            id="correoCapitan"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.correoCapitan)}
            {...register('correoCapitan')}
          />
          {errors.correoCapitan && (
            <p role="alert">{errors.correoCapitan.message}</p>
          )}

          <label htmlFor="telefonoCapitan">Teléfono</label>
          <input
            id="telefonoCapitan"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            autoComplete="tel-national"
            aria-invalid={Boolean(errors.telefonoCapitan)}
            aria-describedby={avisoTelefono ? 'telefono-aviso' : undefined}
            {...telefonoRegistro}
            onChange={(event) => {
              const limpio = event.target.value.replace(/\D/g, '').slice(0, 10);
              setAvisoTelefono(limpio !== event.target.value);
              event.target.value = limpio;
              void onChangeTelefono(event);
            }}
          />
          {avisoTelefono && (
            <p id="telefono-aviso" className="registro-aviso">
              Solo se admiten dígitos.
            </p>
          )}
          {errors.telefonoCapitan && (
            <p role="alert">{errors.telefonoCapitan.message}</p>
          )}

          <label htmlFor="identificacionInstitucional">
            Número de identificación institucional
            <span> (Opcional para universitarios)</span>
          </label>
          <input
            id="identificacionInstitucional"
            {...register('identificacionInstitucional')}
          />

          <div role="region" aria-label="Integrantes del equipo">
            {fields.map((field, indice) => {
              const errorCorreo = errors.integrantes?.[indice]?.correo;
              const idErrorCorreo = `integrantes.${indice}.correo-error`;
              return (
                <div key={field.id} className="registro-integrante">
                  <label htmlFor={`integrantes.${indice}.nombre`}>
                    Integrante {indice + 1}: nombre completo
                  </label>
                  <input
                    id={`integrantes.${indice}.nombre`}
                    aria-invalid={Boolean(errors.integrantes?.[indice]?.nombre)}
                    {...register(`integrantes.${indice}.nombre` as const)}
                  />
                  {errors.integrantes?.[indice]?.nombre && (
                    <p role="alert">
                      {errors.integrantes[indice]?.nombre?.message}
                    </p>
                  )}

                  <label htmlFor={`integrantes.${indice}.correo`}>
                    Correo electrónico (Opcional)
                  </label>
                  <input
                    id={`integrantes.${indice}.correo`}
                    type="email"
                    inputMode="email"
                    aria-invalid={Boolean(errorCorreo)}
                    aria-describedby={errorCorreo ? idErrorCorreo : undefined}
                    {...register(`integrantes.${indice}.correo` as const)}
                  />
                  {errorCorreo && (
                    <p role="alert" id={idErrorCorreo}>
                      {errorCorreo.message}
                    </p>
                  )}

                  {fields.length > 1 && (
                    <button
                      type="button"
                      className="button button--secondary"
                      onClick={() => {
                        const confirmado = window.confirm(
                          `¿Quitar al integrante ${indice + 1}? Se perderán los datos capturados para esta persona.`,
                        );
                        if (confirmado) remove(indice);
                      }}
                    >
                      Eliminar integrante {indice + 1}
                    </button>
                  )}
                </div>
              );
            })}

            <button
              type="button"
              className="button button--secondary"
              onClick={() => {
                const nuevoIndice = fields.length;
                append({ nombre: '', correo: '' });
                requestAnimationFrame(() => {
                  document
                    .getElementById(`integrantes.${nuevoIndice}.nombre`)
                    ?.focus();
                });
              }}
            >
              Agregar integrante
            </button>
          </div>
        </fieldset>
      )}

      {pasoActual === 'robot' && (
        <fieldset>
          <legend>Robot</legend>

          <label htmlFor="nombreRobot">Nombre del robot</label>
          <input
            id="nombreRobot"
            aria-invalid={Boolean(errors.nombreRobot)}
            ref={combinarRefs(nombreRobotRef, primerCampoRef)}
            {...nombreRobotRegistro}
          />
          {errors.nombreRobot && (
            <p role="alert">{errors.nombreRobot.message}</p>
          )}

          <label htmlFor="descripcionRobot">
            Descripción del robot (máximo 300 palabras)
          </label>
          <textarea
            id="descripcionRobot"
            rows={6}
            aria-invalid={Boolean(errors.descripcionRobot)}
            {...register('descripcionRobot')}
          />
          {errors.descripcionRobot && (
            <p role="alert">{errors.descripcionRobot.message}</p>
          )}
        </fieldset>
      )}

      {pasoActual === 'documentos' && (
        <fieldset>
          <legend>Documentos y consentimientos</legend>

          <p>
            Sube los documentos requeridos en la convocatoria. Te recordamos qué
            documentos son y los formatos aceptables para cada uno.
            <ul>
              <li> - Comprobante de pago: PDF, JPG o PNG. </li>
              <li> - Identificación: PDF. </li>
              <li> - Carta responsiva: PDF. </li>
            </ul>
            Límite provisional de {formatearBytes(MAX_ARCHIVO_BYTES)} por
            archivo y {formatearBytes(MAX_TOTAL_ARCHIVOS_BYTES)} en total.
          </p>

          {DOCUMENTOS.map((documento, indice) => {
            const archivo = archivos[documento.campo];
            const error = erroresArchivo[documento.campo];
            const idInput = `documento-${documento.campo}`;
            return (
              <div key={documento.campo} className="registro-archivo">
                <label htmlFor={idInput}>
                  {archivo ? 'Reemplazar' : 'Seleccionar'}: {documento.etiqueta}
                </label>
                {archivo && (
                  <div className="registro-archivo__seleccionado">
                    <p>
                      Archivo seleccionado: <strong>{archivo.name}</strong> (
                      {formatearBytes(archivo.size)}). Aún no se ha enviado.
                    </p>
                    <button
                      type="button"
                      className="button button--secondary"
                      onClick={() => quitarArchivo(documento.campo)}
                    >
                      Quitar {documento.etiqueta.toLowerCase()}
                    </button>
                  </div>
                )}
                <input
                  id={idInput}
                  type="file"
                  accept={ACCEPT_DOCUMENTO[documento.campo]}
                  aria-invalid={Boolean(error)}
                  ref={indice === 0 ? primerCampoRef : undefined}
                  onChange={(event) =>
                    void alSeleccionarArchivo(
                      documento.campo,
                      event.currentTarget,
                    )
                  }
                />
                {error && <p role="alert">{error}</p>}
              </div>
            );
          })}
          {errorTotal && <p role="alert">{errorTotal}</p>}

          <label className="registro-consentimiento">
            <input type="checkbox" {...register('aceptaReglamento')} />
            <span>Acepto el reglamento de la categoría seleccionada.</span>
          </label>
          {errors.aceptaReglamento && (
            <p role="alert">{errors.aceptaReglamento.message}</p>
          )}

          <label className="registro-consentimiento">
            <input type="checkbox" {...register('aceptaUsoImagen')} />
            <span>
              Acepto el uso de fotografías y material audiovisual del equipo.
            </span>
          </label>
          {errors.aceptaUsoImagen && (
            <p role="alert">{errors.aceptaUsoImagen.message}</p>
          )}

          <label className="registro-consentimiento">
            <input
              type="checkbox"
              {...register('confirmaRestriccionesCategoria')}
            />
            <span>
              Confirmo que el robot cumple las restricciones técnicas de su
              categoría.
            </span>
          </label>
          {errors.confirmaRestriccionesCategoria && (
            <p role="alert">{errors.confirmaRestriccionesCategoria.message}</p>
          )}
        </fieldset>
      )}

      {pasoActual === 'revision' && valores && (
        <fieldset>
          <legend>Revisión antes de enviar</legend>
          <p>
            Comprueba que tus datos son correctos antes de enviar la
            inscripción.
          </p>
          <dl>
            <dt>Equipo</dt>
            <dd>{valores.nombreEquipo}</dd>
            <dt>Categoría</dt>
            <dd>
              {
                categories.find((c) => c.slug === valores.categoria)
                  ?.workingName
              }
            </dd>
            <dt>Institución</dt>
            <dd>{valores.institucion}</dd>
            <dt>Procedencia</dt>
            <dd>{valores.estadoCiudadProcedencia}</dd>
            <dt>Capitán o capitana</dt>
            <dd>{valores.nombreCapitan}</dd>
            <dt>Correo</dt>
            <dd>{valores.correoCapitan}</dd>
            <dt>Teléfono</dt>
            <dd>{valores.telefonoCapitan}</dd>
            <dt>Identificación institucional</dt>
            <dd>{valores.identificacionInstitucional || 'No proporcionada'}</dd>
            <dt>Integrantes ({valores.integrantes.length})</dt>
            <dd>
              <ul>
                {valores.integrantes.map((integrante, indice) => (
                  <li key={indice}>
                    {integrante.nombre}
                    {integrante.correo ? ` · ${integrante.correo}` : ''}
                  </li>
                ))}
              </ul>
            </dd>
            <dt>Robot</dt>
            <dd>{valores.nombreRobot}</dd>
            <dt>Descripción</dt>
            <dd>{valores.descripcionRobot}</dd>
            <dt>Confirmaciones</dt>
            <dd>
              <ul>
                <li>Reglamento: {si(valores.aceptaReglamento)}</li>
                <li>Uso de imagen: {si(valores.aceptaUsoImagen)}</li>
                <li>
                  Cumple restricciones:{' '}
                  {si(valores.confirmaRestriccionesCategoria)}
                </li>
              </ul>
            </dd>
            <dt>Documentos</dt>
            <dd>
              <ul>
                {DOCUMENTOS.map((documento) => {
                  const archivo = archivos[documento.campo];
                  return (
                    <li key={documento.campo}>
                      {documento.etiqueta}:{' '}
                      {archivo
                        ? `${archivo.name} (${formatearBytes(archivo.size)})`
                        : 'sin archivo'}
                    </li>
                  );
                })}
              </ul>
            </dd>
          </dl>
        </fieldset>
      )}

      <div className="cluster registro-navegacion">
        {indicePaso > 0 && (
          <button
            type="button"
            className="button button--secondary"
            onClick={irAlPasoAnterior}
            disabled={envio.estado === 'enviando'}
          >
            Volver
          </button>
        )}

        {pasoActual !== 'revision' && (
          <button type="submit" className="button">
            Continuar
          </button>
        )}

        {pasoActual === 'revision' && (
          <button
            type="submit"
            className="button"
            disabled={envio.estado === 'enviando'}
            aria-busy={envio.estado === 'enviando'}
          >
            {envio.estado === 'enviando'
              ? 'Enviando registro de prueba…'
              : 'Enviar registro de prueba'}
          </button>
        )}
      </div>
    </form>
  );
}
