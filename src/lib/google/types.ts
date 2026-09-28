export interface RegistrationMember {
  nombre: string;
  correo?: string;
}

export interface RegistrationData {
  transactionId: string;
  nombreEquipo: string;
  categoria: string;
  institucion: string;
  estadoCiudadProcedencia: string;
  nombreCapitan: string;
  correoCapitan: string;
  telefonoCapitan: string;
  identificacionInstitucional?: string;
  integrantes: RegistrationMember[];
  nombreRobot: string;
  descripcionRobot: string;
  aceptaReglamento: boolean;
  aceptaUsoImagen: boolean;
  confirmaRestriccionesCategoria: boolean;
  archivoIdentificacion: File;
  comprobantePago: File;
  cartaResponsiva: File;
}

export interface RegistrationResult {
  success: true;
  message: string;
  isDuplicate?: boolean;
}

export interface GoogleAdapter {
  saveRegistration(data: RegistrationData): Promise<RegistrationResult>;
}
