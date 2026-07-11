const SAZITO_API_ORIGIN = 'http://api.sazito.com:8080';

interface ProxyContext {
  params: Promise<{ path: string[] }>;
}

async function proxyRequest(request: Request, context: ProxyContext): Promise<Response> {
  const { path } = await context.params;
  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(`/${path.join('/')}${incomingUrl.search}`, SAZITO_API_ORIGIN);
  const shopDomain = request.headers.get('x-sazito-shop-domain')
    ?? request.headers.get('x-forwarded-host');

  if (!shopDomain) {
    return Response.json({ message: 'Shop domain is required.' }, { status: 400 });
  }

  const headers = new Headers({
    accept: request.headers.get('accept') ?? 'application/json',
    'x-forwarded-host': shopDomain,
  });
  const contentType = request.headers.get('content-type');
  const authorization = request.headers.get('authorization');

  if (contentType) {
    headers.set('content-type', contentType);
  }
  if (authorization) {
    headers.set('authorization', authorization);
  }

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD'
        ? undefined
        : await request.arrayBuffer(),
      cache: 'no-store',
      redirect: 'manual',
    });
    const responseHeaders = new Headers(upstreamResponse.headers);

    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');
    responseHeaders.delete('transfer-encoding');

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch {
    return Response.json(
      { message: 'Unable to reach the Sazito API.' },
      { status: 502 },
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
