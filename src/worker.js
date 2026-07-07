import { handleCmsRequest } from './server/cms.js';

function isHtmlResponse(request, response, url) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return false;
  }

  const contentType = response.headers.get('Content-Type') || '';
  const accept = request.headers.get('Accept') || '';

  return (
    contentType.includes('text/html') ||
    accept.includes('text/html') ||
    url.pathname === '/' ||
    url.pathname.endsWith('.html')
  );
}

function withHtmlCacheHeaders(request, response, url) {
  if (!isHtmlResponse(request, response, url)) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      return handleCmsRequest(request, env, ctx);
    }

    if (url.pathname === '/setup' || url.pathname === '/setup/') {
      const setupUrl = new URL('/setup.html', url);
      return Response.redirect(setupUrl.toString(), 302);
    }

    if (env.ASSETS?.fetch) {
      const response = await env.ASSETS.fetch(request);
      return withHtmlCacheHeaders(request, response, url);
    }

    return new Response('Static assets binding not configured.', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    });
  }
};
