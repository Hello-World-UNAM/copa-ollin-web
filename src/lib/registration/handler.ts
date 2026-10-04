import {
  GoogleAdapterConfigurationError,
  GoogleAdapterRecoveryError,
  GoogleAdapterTemporaryError,
} from '../google/errors';
import { registerSchema } from '../schemas/register';
import type { GoogleAdapter } from '../google/types';
import { CAMPOS_ARCHIVO, CAMPOS_ESCALARES } from '../registro/contract';

const scalarFieldNames = CAMPOS_ESCALARES;
const fileFieldNames = CAMPOS_ARCHIVO;

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

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
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
