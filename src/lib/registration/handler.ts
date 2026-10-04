import { timingSafeEqual } from 'node:crypto';
import {
  GoogleAdapterConfigurationError,
  GoogleAdapterRecoveryError,
  GoogleAdapterTemporaryError,
} from '../google/errors';
import {
  MAX_SANDBOX_REQUEST_BODY_SIZE,
  registerSchema,
} from '../schemas/register';
import type { GoogleAdapter } from '../google/types';

const scalarFieldNames = [
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
] as const;

const fileFieldNames = [
  'archivoIdentificacion',
  'comprobantePago',
  'cartaResponsiva',
] as const;

const allowedFieldNames = new Set<string>([
  ...scalarFieldNames,
  ...fileFieldNames,
]);

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function hasValidSandboxAuthorization(
  request: Request,
  expectedToken: string,
): boolean {
  const authorization = request.headers.get('authorization');
  const match = authorization?.match(/^Bearer ([^\s]+)$/);
  if (!match?.[1]) return false;

  const expected = Buffer.from(expectedToken, 'utf8');
  const provided = Buffer.from(match[1], 'utf8');
  return (
    expected.length === provided.length && timingSafeEqual(expected, provided)
  );
}

function createRequestWithBodyLimit(request: Request) {
  let bodyTooLarge = false;
  let bytesRead = 0;

  if (!request.body) {
    return { request, isBodyTooLarge: () => bodyTooLarge };
  }

  const limitedBody = request.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        bytesRead += chunk.byteLength;
        if (bytesRead > MAX_SANDBOX_REQUEST_BODY_SIZE) {
          bodyTooLarge = true;
          controller.error(new Error('Sandbox request body too large'));
          return;
        }
        controller.enqueue(chunk);
      },
    }),
  );
  const requestInit = {
    body: limitedBody,
    duplex: 'half',
  } as RequestInit & { duplex: 'half' };

  return {
    request: new Request(request, requestInit),
    isBodyTooLarge: () => bodyTooLarge,
  };
}

function readSingleString(
  formData: FormData,
  name: string,
): string | undefined {
  const values = formData.getAll(name);
  if (values.length !== 1 || typeof values[0] !== 'string') return undefined;
  return values[0];
}

function parseBoolean(value: string | undefined): boolean | undefined {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function parseFormData(formData: FormData): unknown {
  for (const name of formData.keys()) {
    if (!allowedFieldNames.has(name)) {
      return { __unexpectedField: name };
    }
    if (formData.getAll(name).length !== 1) {
      return { __repeatedField: true };
    }
  }

  const rawIntegrantes = readSingleString(formData, 'integrantes');
  let integrantes: unknown;
  try {
    integrantes =
      rawIntegrantes === undefined ? undefined : JSON.parse(rawIntegrantes);
  } catch {
    integrantes = undefined;
  }

  const raw: Record<string, unknown> = {};
  for (const fieldName of scalarFieldNames) {
    if (fieldName === 'integrantes') {
      raw.integrantes = integrantes;
      continue;
    }
    if (
      fieldName === 'aceptaReglamento' ||
      fieldName === 'aceptaUsoImagen' ||
      fieldName === 'confirmaRestriccionesCategoria'
    ) {
      raw[fieldName] = parseBoolean(readSingleString(formData, fieldName));
      continue;
    }
    const value = readSingleString(formData, fieldName);
    if (value !== undefined) raw[fieldName] = value;
  }

  for (const fieldName of fileFieldNames) {
    const values = formData.getAll(fieldName);
    if (values.length === 1 && values[0] instanceof File) {
      raw[fieldName] = values[0];
    }
  }

  return raw;
}

export function createRegistrationHandler(options: {
  adapter: GoogleAdapter;
  sandboxEnabled: boolean;
  sandboxAccessToken?: string;
}): (request: Request) => Promise<Response> {
  return async (request) => {
    if (!options.sandboxEnabled) {
      return jsonResponse(
        {
          code: 'SANDBOX_DISABLED',
          error: 'El endpoint de registro en sandbox está deshabilitado.',
        },
        503,
      );
    }

    if (!options.sandboxAccessToken) {
      return jsonResponse(
        {
          code: 'SANDBOX_AUTH_NOT_CONFIGURED',
          error: 'La autorización del sandbox no está configurada.',
        },
        503,
      );
    }

    if (!hasValidSandboxAuthorization(request, options.sandboxAccessToken)) {
      return jsonResponse(
        {
          code: 'SANDBOX_UNAUTHORIZED',
          error: 'Se requiere autorización para usar el sandbox.',
        },
        401,
      );
    }

    const contentLength = request.headers.get('content-length');
    if (
      contentLength !== null &&
      /^\d+$/.test(contentLength) &&
      Number(contentLength) > MAX_SANDBOX_REQUEST_BODY_SIZE
    ) {
      return jsonResponse(
        {
          code: 'PAYLOAD_TOO_LARGE',
          error: 'La solicitud supera el límite de tamaño del sandbox.',
        },
        413,
      );
    }

    const limitedRequest = createRequestWithBodyLimit(request);
    let formData: FormData;
    try {
      formData = await limitedRequest.request.formData();
    } catch {
      if (limitedRequest.isBodyTooLarge()) {
        return jsonResponse(
          {
            code: 'PAYLOAD_TOO_LARGE',
            error: 'La solicitud supera el límite de tamaño del sandbox.',
          },
          413,
        );
      }
      return jsonResponse(
        {
          code: 'INVALID_MULTIPART',
          error: 'La solicitud debe contener FormData válido.',
        },
        400,
      );
    }

    const rawData = parseFormData(formData);
    if (
      typeof rawData === 'object' &&
      rawData !== null &&
      '__unexpectedField' in rawData
    ) {
      return jsonResponse(
        {
          code: 'UNEXPECTED_FIELD',
          error: 'La solicitud contiene un campo no permitido.',
        },
        400,
      );
    }
    if (
      typeof rawData === 'object' &&
      rawData !== null &&
      '__repeatedField' in rawData
    ) {
      return jsonResponse(
        {
          code: 'REPEATED_FIELD',
          error: 'Cada campo debe enviarse exactamente una vez.',
        },
        400,
      );
    }

    const validation = await registerSchema.safeParseAsync(rawData);
    if (!validation.success) {
      return jsonResponse(
        {
          code: 'VALIDATION_ERROR',
          error: 'Los datos o archivos no cumplen el esquema de sandbox.',
          details: validation.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        400,
      );
    }

    try {
      const result = await options.adapter.saveRegistration(validation.data);
      return jsonResponse(
        {
          code: result.isDuplicate ? 'DUPLICATE' : 'SAVED',
          message: result.message,
          isDuplicate: result.isDuplicate ?? false,
        },
        200,
      );
    } catch (error) {
      if (error instanceof GoogleAdapterConfigurationError) {
        return jsonResponse(
          {
            code: 'SANDBOX_CONFIGURATION_ERROR',
            error: 'La integración de Google Sandbox no está configurada.',
          },
          503,
        );
      }

      if (error instanceof GoogleAdapterRecoveryError) {
        return jsonResponse(
          {
            code: 'RECOVERY_REQUIRED',
            recoveryStage: error.recoveryStage,
            providerStatus: error.providerStatus,
            error:
              'Falló el guardado y requiere revisión de limpieza del sandbox.',
            recoverable: true,
          },
          502,
        );
      }

      if (error instanceof GoogleAdapterTemporaryError) {
        return jsonResponse(
          {
            code: 'TEMPORARY_STORAGE_ERROR',
            error: 'El almacenamiento del sandbox falló temporalmente.',
            recoverable: true,
          },
          502,
        );
      }

      return jsonResponse(
        {
          code: 'INTERNAL_ERROR',
          error: 'Ocurrió un error interno en el endpoint.',
        },
        500,
      );
    }
  };
}
