/** Puente opt-in exclusivo de Astro dev en loopback. Nunca autoriza staging. */
export function authorizeLocalSandboxRequest(
  request: Request,
  options: {
    development: boolean;
    enabled: boolean;
    clientAddress: string;
    serverToken?: string;
  },
): Request {
  const url = new URL(request.url);
  const localHosts = ['localhost', '127.0.0.1', '[::1]'];
  const localPeers = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
  const forwardedHeaders = [
    'forwarded',
    'x-forwarded-for',
    'x-forwarded-host',
    'x-forwarded-proto',
  ];
  if (
    !options.development ||
    !options.enabled ||
    !options.serverToken ||
    request.method !== 'POST' ||
    !localHosts.includes(url.hostname) ||
    !localPeers.includes(options.clientAddress) ||
    request.headers.get('origin') !== url.origin ||
    forwardedHeaders.some((header) => request.headers.has(header)) ||
    request.headers.has('authorization')
  ) {
    return request;
  }

  const headers = new Headers(request.headers);
  headers.set('authorization', `Bearer ${options.serverToken}`);
  return new Request(request, { headers });
}
