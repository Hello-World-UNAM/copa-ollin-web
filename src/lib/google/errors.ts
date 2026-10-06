export class GoogleAdapterConfigurationError extends Error {
  constructor(
    message = 'La integración de Google Sandbox no está configurada.',
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'GoogleAdapterConfigurationError';
  }
}

export class GoogleAdapterTemporaryError extends Error {
  constructor(
    message = 'El almacenamiento del sandbox no está disponible temporalmente.',
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'GoogleAdapterTemporaryError';
  }
}

export class GoogleAdapterRecoveryError extends GoogleAdapterTemporaryError {
  constructor(
    readonly recoveryStage:
      | 'drive-upload-outcome-unknown'
      | 'sheets-reconciliation-failed'
      | 'sheets-row-state-ambiguous'
      | 'drive-cleanup-failed'
      | 'idempotency-reservation-recovery-required'
      | 'idempotency-reservation-state-unknown',
    readonly providerStatus?: number,
    options?: ErrorOptions,
  ) {
    super(
      'Falló el guardado y no se pudo confirmar la limpieza completa del sandbox.',
      options,
    );
    this.name = 'GoogleAdapterRecoveryError';
  }
}

export class GoogleAdapterConflictError extends Error {
  constructor(
    message = 'El identificador ya se usó con datos o documentos distintos.',
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'GoogleAdapterConflictError';
  }
}
