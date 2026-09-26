import type { RegistroPayload } from './schema';

export interface RegistroSandboxMockResult {
  ok: true;
  folioSandbox: string;
  recibidoEn: string;
}

export async function submitRegistroSandboxMock(
  payload: RegistroPayload,
): Promise<RegistroSandboxMockResult> {
  void payload; // el mock no persiste ni transmite datos.

  await new Promise((resolve) => setTimeout(resolve, 600));

  return {
    ok: true,
    folioSandbox: `SANDBOX-${Date.now()}`,
    recibidoEn: new Date().toISOString(),
  };
}
