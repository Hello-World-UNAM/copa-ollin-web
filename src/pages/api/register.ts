import type { APIRoute } from 'astro';
import { googleAdapter } from '../../lib/google';
import { createRegistrationHandler } from '../../lib/registration/handler';

export const prerender = false;

const handleRegistration = createRegistrationHandler({
  adapter: googleAdapter,
  sandboxEnabled: import.meta.env.ENABLE_SANDBOX_REGISTRATION === 'true',
  sandboxAccessToken: process.env.SANDBOX_REGISTRATION_TOKEN,
});

export const POST: APIRoute = ({ request }) => handleRegistration(request);
