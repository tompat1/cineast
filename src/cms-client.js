const envBase = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_CINEAST_API_BASE : '';
const windowBase = typeof window !== 'undefined' ? window.CINEAST_API_BASE : '';
const API_BASE = String(envBase || windowBase || '').replace(/\/$/, '');

function buildUrl(path) {
  return `${API_BASE}${path}`;
}

async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const init = {
    credentials: 'include',
    ...options,
    headers
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
    init.body = JSON.stringify(options.body);
  }

  const response = await fetch(buildUrl(path), init);
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json().catch(() => null) : await response.text().catch(() => '');

  if (!response.ok) {
    const message = payload && typeof payload === 'object'
      ? payload.reason || payload.error || payload.message || 'Request failed'
      : (payload || 'Request failed');
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export function getCurrentUser() {
  return apiFetch('/api/auth/me');
}

export function login(username, password) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: { username, password }
  });
}

export function register(username, password) {
  return apiFetch('/api/auth/register', {
    method: 'POST',
    body: { username, password }
  });
}

export function logout() {
  return apiFetch('/api/auth/logout', {
    method: 'POST'
  });
}

export function getAuthSettings() {
  return apiFetch('/api/settings');
}

export function getHealth() {
  return apiFetch('/api/health');
}

export function updateAuthSettings(payload) {
  return apiFetch('/api/admin/settings', {
    method: 'PATCH',
    body: payload
  });
}

export function getTagOverrides() {
  return apiFetch('/api/tag-overrides');
}

export function updateTagOverrides(payload) {
  return apiFetch('/api/admin/tag-overrides', {
    method: 'PUT',
    body: payload
  });
}

export function listUsers() {
  return apiFetch('/api/admin/users');
}

export function createUser(user) {
  return apiFetch('/api/admin/users', {
    method: 'POST',
    body: user
  });
}

export function listPages({ includeDrafts = false, limit = 50, status = 'all' } = {}) {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  if (includeDrafts) params.set('includeDrafts', '1');
  if (status) params.set('status', status);
  return apiFetch(`/api/pages?${params.toString()}`);
}

export function searchPages(query, { includeDrafts = false, limit = 10, status = 'all' } = {}) {
  const params = new URLSearchParams();
  params.set('q', query || '');
  params.set('limit', String(limit));
  if (includeDrafts) params.set('includeDrafts', '1');
  if (status) params.set('status', status);
  return apiFetch(`/api/pages/search?${params.toString()}`);
}

export function searchArchive(query, { limit = 12 } = {}) {
  const params = new URLSearchParams();
  params.set('q', query || '');
  params.set('limit', String(limit));
  return apiFetch(`/api/search?${params.toString()}`);
}

export function fetchSearchWarmup() {
  return apiFetch('/api/search/warmup');
}

export function getPage(key) {
  return apiFetch(`/api/pages/${encodeURIComponent(key)}`);
}

export function createPage(page) {
  return apiFetch('/api/pages', {
    method: 'POST',
    body: page
  });
}

export function updatePage(key, page) {
  return apiFetch(`/api/pages/${encodeURIComponent(key)}`, {
    method: 'PATCH',
    body: page
  });
}

export function deletePage(key) {
  return apiFetch(`/api/pages/${encodeURIComponent(key)}`, {
    method: 'DELETE'
  });
}

export function syncJournalArticle(article) {
  const title = article?.title || '';
  const explicitSlug = String(article?.slug || '').trim();
  const slugSource = explicitSlug || `${article?.id || ''} ${title}`.trim();
  const normalizedSlug = String(slugSource).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const slug = explicitSlug && normalizedSlug.startsWith('journal-')
    ? normalizedSlug
    : (normalizedSlug ? `journal-${normalizedSlug}` : '');

  return {
    id: article?.id || '',
    slug,
    title,
    meta: article?.meta || '',
    entry_number: article?.entry_number || '',
    summary: article?.preamble || article?.summary || '',
    hero_image: article?.image || '',
    kind: 'journal',
    status: 'published',
    content: article?.content || ''
  };
}

export function searchTmdb(query) {
  const params = new URLSearchParams();
  params.set('query', query || '');
  return apiFetch(`/api/tmdb/search?${params.toString()}`);
}

export function fetchTmdbImages(movieId) {
  const params = new URLSearchParams();
  params.set('movieId', movieId || '');
  return apiFetch(`/api/tmdb/images?${params.toString()}`);
}

export function enrichArticleWithTmdb(payload) {
  return apiFetch('/api/tmdb/enrich', {
    method: 'POST',
    body: payload
  });
}

export function getReactions(slug) {
  const params = new URLSearchParams();
  params.set('slug', slug);
  return apiFetch(`/api/reactions?${params.toString()}`);
}

export function toggleReaction(slug, reactionType) {
  return apiFetch('/api/reactions', {
    method: 'POST',
    body: { slug, reaction_type: reactionType }
  });
}
