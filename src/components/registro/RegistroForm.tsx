import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import {
  Controller,
  useFieldArray,
  useForm,
  type SubmitHandler,
} from 'react-hook-form';

import { categories } from '../../data/categories';
import { crearRegistroFormData } from '../../lib/registro/formData';
import {
  submitRegistroSandboxMock,
  type RegistroSandboxMockResult,
} from '../../lib/registro/mockAdapter';
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

// Campos que se validan al intentar avanzar desde cada paso.
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
    'archivoIdentificacion',
    'comprobantePago',
    'cartaResponsiva',
  ],
  revision: [],
};

type EstadoEnvio =
  | { estado: 'inactivo' }
  | { estado: 'enviando' }
  | { estado: 'exito'; resultado: RegistroSandboxMockResult }
  | { estado: 'error'; mensaje: string };

interface Props {
  usarEndpointSandbox?: boolean;
}

function combinarRefs<T>(
  refRegistro: (instancia: T | null) => void,
  refExterno: React.MutableRefObject<T | null>,
) {
  return (instancia: T | null) => {
    refRegistro(instancia);
    refExterno.current = instancia;
  };
}

export default function RegistroForm({ usarEndpointSandbox = false }: Props) {
  const [pasoActual, setPasoActual] = useState<PasoId>('equipo');
  const [envio, setEnvio] = useState<EstadoEnvio>({ estado: 'inactivo' });

  const anuncioRef = useRef<HTMLDivElement>(null);
  const primerCampoRef = useRef<HTMLInputElement>(null);
  const primerConsentimientoRef = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    trigger,
    getValues,
    setValue,
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
  const transactionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (transactionIdRef.current) return;

    transactionIdRef.current = window.crypto.randomUUID();
    setValue('transactionId', transactionIdRef.current);
  }, [setValue]);

  const { ref: nombreEquipoRef, ...nombreEquipoRegistro } =
    register('nombreEquipo');
  const { ref: nombreCapitanRef, ...nombreCapitanRegistro } =
    register('nombreCapitan');
  const { ref: nombreRobotRef, ...nombreRobotRegistro } =
    register('nombreRobot');
  const { ref: aceptaReglamentoRef, ...aceptaReglamentoRegistro } =
    register('aceptaReglamento');

  // Anuncia el cambio de paso a lectores de pantalla y mueve el foco al
  // primer campo del paso nuevo, sin robar foco fuera de una navegación.
  useEffect(() => {
    if (anuncioRef.current && pasoInfo) {
      anuncioRef.current.textContent = `Paso ${indicePaso + 1} de ${pasos.length}: ${pasoInfo.titulo}.`;
    }

    if (pasoActual === 'documentos') {
      primerConsentimientoRef.current?.focus();
      return;
    }

    primerCampoRef.current?.focus();
  }, [pasoActual, indicePaso, pasoInfo]);

  async function irAlSiguientePaso() {
    const camposValidos = await trigger(camposPorPaso[pasoActual], {
      shouldFocus: true,
    });
    if (!camposValidos) return;

    const siguiente = pasos[indicePaso + 1];
    if (siguiente) setPasoActual(siguiente.id);
  }

  function irAlPasoAnterior() {
    const anterior = pasos[indicePaso - 1];
    if (anterior) setPasoActual(anterior.id);
  }

  const onSubmit: SubmitHandler<RegistroPayload> = async (payload) => {
    setEnvio({ estado: 'enviando' });
    try {
      const formData = crearRegistroFormData(payload);
      if (usarEndpointSandbox) {
        const response = await fetch('/api/register', {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          throw new Error('El endpoint de sandbox rechazó la solicitud.');
        }

        setEnvio({
          estado: 'exito',
          resultado: {
            ok: true,
            folioSandbox: payload.transactionId,
            recibidoEn: new Date().toISOString(),
          },
        });
        return;
      }

      const resultado = await submitRegistroSandboxMock(formData);
      setEnvio({ estado: 'exito', resultado });
    } catch {
      setEnvio({
        estado: 'error',
        mensaje:
          'No se pudo enviar el registro de prueba. Revisa tu conexión e inténtalo de nuevo.',
      });
    }
  };

  if (envio.estado === 'exito') {
    return (
      <div role="status" className="card registro-confirmacion">
        <p className="eyebrow">Registro de prueba recibido</p>
        <h2>Recibimos tu registro ficticio para prueba</h2>
        <p>
          Folio de sandbox: <strong>{envio.resultado.folioSandbox}</strong>.
          Este folio es exclusivamente de prueba:{' '}
          <strong>no representa una inscripción aceptada</strong> ni un lugar
          confirmado en Copa Ollin.
        </p>
      </div>
    );
  }

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

      <ol className="registro-progreso" aria-label="Progreso del registro">
        {pasos.map((paso, indice) => (
          <li
            key={paso.id}
            aria-current={paso.id === pasoActual ? 'step' : undefined}
            data-completado={indice < indicePaso}
          >
            Paso {indice + 1} de {pasos.length}: {paso.titulo}
          </li>
        ))}
      </ol>

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
            aria-invalid={Boolean(errors.estadoCiudadProcedencia)}
            {...register('estadoCiudadProcedencia')}
          />
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
            inputMode="tel"
            autoComplete="tel"
            aria-invalid={Boolean(errors.telefonoCapitan)}
            {...register('telefonoCapitan')}
          />
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
            {fields.map((field, indice) => (
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
                  {...register(`integrantes.${indice}.correo` as const)}
                />

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
            ))}

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
            Selecciona únicamente archivos PDF ficticios para esta prueba. Los
            archivos se validan en este formulario, pero no se envían ni se
            conservan todavía.
          </p>

          {(
            [
              {
                name: 'comprobantePago',
                id: 'sandbox-comprobante-pago',
                etiqueta: 'Comprobante de pago (PDF ficticio)',
              },
              {
                name: 'archivoIdentificacion',
                id: 'sandbox-identificacion',
                etiqueta: 'Identificación del capitán (PDF ficticio)',
              },
              {
                name: 'cartaResponsiva',
                id: 'sandbox-carta-responsiva',
                etiqueta: 'Carta responsiva (PDF ficticio)',
              },
            ] as const
          ).map((documento) => (
            <Controller
              key={documento.id}
              control={control}
              name={documento.name}
              render={({ field, fieldState }) => (
                <div>
                  <label htmlFor={documento.id}>{documento.etiqueta}</label>
                  <input
                    id={documento.id}
                    type="file"
                    accept="application/pdf,.pdf"
                    aria-invalid={fieldState.invalid}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    onChange={(event) => {
                      field.onChange(event.currentTarget.files?.[0]);
                    }}
                  />
                  {fieldState.error && (
                    <p role="alert">{fieldState.error.message}</p>
                  )}
                </div>
              )}
            />
          ))}
          <p>Máximo 1 MiB por PDF y 3 MiB entre los tres archivos.</p>

          <label>
            <input
              type="checkbox"
              ref={combinarRefs(aceptaReglamentoRef, primerConsentimientoRef)}
              {...aceptaReglamentoRegistro}
            />
            Acepto el reglamento de la categoría seleccionada.
          </label>
          {errors.aceptaReglamento && (
            <p role="alert">{errors.aceptaReglamento.message}</p>
          )}

          <label>
            <input type="checkbox" {...register('aceptaUsoImagen')} />
            Acepto el uso de fotografías y material audiovisual del equipo.
          </label>
          {errors.aceptaUsoImagen && (
            <p role="alert">{errors.aceptaUsoImagen.message}</p>
          )}

          <label>
            <input
              type="checkbox"
              {...register('confirmaRestriccionesCategoria')}
            />
            Confirmo que el robot cumple las restricciones técnicas de su
            categoría.
          </label>
          {errors.confirmaRestriccionesCategoria && (
            <p role="alert">{errors.confirmaRestriccionesCategoria.message}</p>
          )}
        </fieldset>
      )}

      {pasoActual === 'revision' && (
        <fieldset>
          <legend>Revisión antes de enviar</legend>
          <p>
            Este envío es exclusivamente de prueba (sandbox). No se procesan
            datos reales ni se acepta una inscripción.
          </p>
          <dl>
            <dt>Equipo</dt>
            <dd>{getValues('nombreEquipo')}</dd>
            <dt>Categoría</dt>
            <dd>
              {
                categories.find((c) => c.slug === getValues('categoria'))
                  ?.workingName
              }
            </dd>
            <dt>Capitán o capitana</dt>
            <dd>{getValues('nombreCapitan')}</dd>
            <dt>Integrantes</dt>
            <dd>{getValues('integrantes').length}</dd>
            <dt>Robot</dt>
            <dd>{getValues('nombreRobot')}</dd>
          </dl>

          {envio.estado === 'error' && <p role="alert">{envio.mensaje}</p>}
        </fieldset>
      )}

      <div className="cluster registro-navegacion">
        {indicePaso > 0 && (
          <button
            type="button"
            className="button button--secondary"
            onClick={irAlPasoAnterior}
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
