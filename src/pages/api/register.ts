import type { APIRoute } from 'astro';
import { googleAdapter } from '../../lib/google';
import { createRegistrationHandler } from '../../lib/registration/handler';
import { authorizeLocalSandboxRequest } from '../../lib/registration/local-browser-auth';

export const prerender = false;

const handleRegistration = createRegistrationHandler({
  adapter: googleAdapter,
  sandboxEnabled: import.meta.env.ENABLE_SANDBOX_REGISTRATION === 'true',
  sandboxAccessToken: process.env.SANDBOX_REGISTRATION_TOKEN,
});

export const POST: APIRoute = ({ request, clientAddress }) =>
  handleRegistration(
    authorizeLocalSandboxRequest(request, {
      development: import.meta.env.DEV,
      enabled: process.env.LOCAL_SANDBOX_BROWSER_AUTH === 'true',
      clientAddress,
      serverToken: process.env.SANDBOX_REGISTRATION_TOKEN,
    }),
  );
