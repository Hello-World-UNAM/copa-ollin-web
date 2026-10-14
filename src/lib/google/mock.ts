import { GoogleAdapterConflictError } from './errors';
import { generarFolio } from './folio';
import { calcularHuella } from './huella';
import type { GoogleAdapter, RegistrationData } from './types';

export interface MockRegistrationSnapshot {
  transactionId: string;
  teamName: string;
  fileNames: string[];
}

const mockDatabase = new Map<string, MockRegistrationSnapshot>();
const mockFingerprints = new Map<string, string>();

export const mockGoogleAdapter: GoogleAdapter = {
  async saveRegistration(data) {
    const fingerprint = await calcularHuella(data);
    if (mockDatabase.has(data.transactionId)) {
      if (mockFingerprints.get(data.transactionId) !== fingerprint) {
        throw new GoogleAdapterConflictError();
      }
      return {
        success: true,
        message: 'Registro duplicado omitido en el mock',
        folio: generarFolio(data.transactionId),
        isDuplicate: true,
      };
    }

    mockFingerprints.set(data.transactionId, fingerprint);
    mockDatabase.set(data.transactionId, {
      transactionId: data.transactionId,
      teamName: data.nombreEquipo,
      fileNames: [
        data.archivoIdentificacion.name,
        data.comprobantePago.name,
        data.cartaResponsiva.name,
      ],
    });

    await new Promise((resolve) => setTimeout(resolve, 25));

    return {
      success: true,
      message: 'Registro guardado en Sandbox (Mock)',
      folio: generarFolio(data.transactionId),
    };
  },
};

export function getMockRegistrationSnapshot(): MockRegistrationSnapshot[] {
  return [...mockDatabase.values()].map((registration) => ({
    ...registration,
    fileNames: [...registration.fileNames],
  }));
}

export function resetMockRegistrationSnapshot(): void {
  mockDatabase.clear();
  mockFingerprints.clear();
}

export function createFakeRegistrationData(
  transactionId: string,
  files: Pick<
    RegistrationData,
    'archivoIdentificacion' | 'comprobantePago' | 'cartaResponsiva'
  >,
): RegistrationData {
  return {
    transactionId,
    nombreEquipo: 'Equipo Ficticio de Prueba',
    categoria: 'micromouse-amateur',
    institucion: 'Institución Ficticia',
    estadoCiudadProcedencia: 'Ciudad Ficticia',
    nombreCapitan: 'Capitana Ficticia',
    correoCapitan: 'capitana@example.invalid',
    telefonoCapitan: '0000000000',
    identificacionInstitucional: 'ID-FICTICIO',
    integrantes: [
      {
        nombre: 'Integrante Ficticio',
        correo: 'integrante@example.invalid',
      },
    ],
    nombreRobot: 'Robot Ficticio',
    descripcionRobot: 'Robot generado exclusivamente para pruebas.',
    aceptaReglamento: true,
    aceptaUsoImagen: false,
    confirmaRestriccionesCategoria: true,
    ...files,
  };
}
