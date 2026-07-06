import { handleCmsRequest } from './server/cms.js';

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
      return env.ASSETS.fetch(request);
    }

    return new Response('Static assets binding not configured.', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    });
  }
};
