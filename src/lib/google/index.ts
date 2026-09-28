// src/lib/google/index.ts
import { mockGoogleAdapter } from './mock';
import { GoogleAdapterConfigurationError } from './errors';
import { realGoogleAdapter } from './real';
import type { GoogleAdapter } from './types';

const useRealGoogleSandbox =
  import.meta.env.USE_MOCK_GOOGLE === 'false' &&
  import.meta.env.ENABLE_REAL_GOOGLE_SANDBOX === 'true';
const useMock =
  import.meta.env.MODE === 'test' ||
  (import.meta.env.DEV && import.meta.env.USE_MOCK_GOOGLE !== 'false');

const unavailableAdapter: GoogleAdapter = {
  async saveRegistration() {
    throw new GoogleAdapterConfigurationError();
  },
};

export const googleAdapter = useMock
  ? mockGoogleAdapter
  : useRealGoogleSandbox
    ? realGoogleAdapter
    : unavailableAdapter;
