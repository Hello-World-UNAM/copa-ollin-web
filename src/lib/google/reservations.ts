import { createHash } from 'node:crypto';
import { FieldValue, Firestore } from '@google-cloud/firestore';
import { GoogleAdapterConfigurationError } from './errors';

export type ReservationState =
  'acquired' | 'processing' | 'completed' | 'recovery-required';

export interface RegistrationReservationStore {
  reserve(transactionId: string): Promise<ReservationState>;
  complete(transactionId: string): Promise<void>;
  release(transactionId: string): Promise<void>;
  markRecoveryRequired(
    transactionId: string,
    recoveryStage: string,
  ): Promise<void>;
  cleanup(transactionId: string): Promise<void>;
  close?(): Promise<void>;
}

export interface FirestoreReservationConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

let runtimeStore: RegistrationReservationStore | undefined;

function getRuntimeConfig(): FirestoreReservationConfig {
  const projectId = process.env.SANDBOX_FIRESTORE_PROJECT_ID?.trim();
  const clientEmail = process.env.SANDBOX_FIRESTORE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.SANDBOX_FIRESTORE_PRIVATE_KEY?.trim();

  if (!projectId || !clientEmail || !privateKey) {
    throw new GoogleAdapterConfigurationError(
      'La reserva Firestore del sandbox no está configurada.',
    );
  }

  return { projectId, clientEmail, privateKey };
}

function reservationDocumentId(transactionId: string): string {
  return createHash('sha256').update(transactionId).digest('hex');
}

export function createFirestoreReservationStore(
  config: FirestoreReservationConfig = getRuntimeConfig(),
): RegistrationReservationStore {
  const firestore = new Firestore({
    projectId: config.projectId,
    credentials: {
      client_email: config.clientEmail,
      private_key: config.privateKey.replace(/\\n/g, '\n'),
    },
  });
  const reservations = firestore.collection('sandboxRegistrationReservations');
  const getReservation = (transactionId: string) =>
    reservations.doc(reservationDocumentId(transactionId));

  return {
    async reserve(transactionId) {
      const reference = getReservation(transactionId);

      return firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(reference);
        if (snapshot.exists) {
          const state = snapshot.get('state');
          if (state === 'completed' || state === 'recovery-required') {
            return state;
          }
          return 'processing';
        }

        transaction.create(reference, {
          state: 'processing',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        return 'acquired';
      });
    },

    async complete(transactionId) {
      await getReservation(transactionId).update({
        state: 'completed',
        updatedAt: FieldValue.serverTimestamp(),
      });
    },

    async release(transactionId) {
      const reference = getReservation(transactionId);
      await firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(reference);
        if (snapshot.exists && snapshot.get('state') === 'processing') {
          transaction.delete(reference);
        }
      });
    },

    async markRecoveryRequired(transactionId, recoveryStage) {
      await getReservation(transactionId).update({
        state: 'recovery-required',
        recoveryStage,
        updatedAt: FieldValue.serverTimestamp(),
      });
    },

    async cleanup(transactionId) {
      await getReservation(transactionId).delete();
    },
    async close() {
      await firestore.terminate();
    },
  };
}

export function getRuntimeRegistrationReservationStore(): RegistrationReservationStore {
  runtimeStore ??= createFirestoreReservationStore();
  return runtimeStore;
}
