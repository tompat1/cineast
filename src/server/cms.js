const SESSION_COOKIE_NAME = 'cineast_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24;
const PASSWORD_HASH_ITERATIONS = 100000;
const PASSWORD_HASH_BITS = 256;
const DEFAULT_PAGE_LIMIT = 50;
const INVITE_ONLY_SETTING_KEY = 'invite_only';
const JOURNAL_ENTRY_COUNTER_SETTING_KEY = 'journal_entry_counter';
const SEARCH_TAG_OVERRIDES_SETTING_KEY = 'search_tag_overrides';
const STATIC_JOURNAL_ENTRY_FLOOR = 4;

const textEncoder = new TextEncoder();

function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'no-store');
  return new Response(JSON.stringify(data), { ...init, headers });
}

function errorResponse(message, status = 400, extra = {}) {
  return json({ error: message, ...extra }, { status });
}

function okResponse(data, init = {}) {
  return json(data, init);
}

function applyCors(request, response) {
  const origin = request.headers.get('Origin');
  if (!origin) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Bootstrap-Token');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  headers.set('Vary', 'Origin');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function corsPreflightResponse(request) {
  const origin = request.headers.get('Origin');
  const headers = new Headers({
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Bootstrap-Token',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  });

  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin);
  }

  return new Response(null, { status: 204, headers });
}

function parseCookies(headerValue = '') {
  return headerValue.split(';').reduce((acc, part) => {
    const index = part.indexOf('=');
    if (index === -1) return acc;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) acc[key] = value;
    return acc;
  }, {});
}

function getRequestToken(request) {
  const authHeader = request.headers.get('Authorization') || '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }

  const cookies = parseCookies(request.headers.get('Cookie') || '');
  return cookies[SESSION_COOKIE_NAME] || '';
}

function setCookie(name, value, { maxAge, secure = false, httpOnly = true, sameSite = 'Lax', path = '/' } = {}) {
  const parts = [`${name}=${value}`, `Path=${path}`, `SameSite=${sameSite}`];
  if (typeof maxAge === 'number') parts.push(`Max-Age=${maxAge}`);
  if (httpOnly) parts.push('HttpOnly');
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

function base64FromBytes(bytes) {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function bufferToBase64(buffer) {
  return Buffer.from(buffer).toString('base64');
}

function normalizeBase64(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');
}

function bytesFromBase64(base64) {
  const normalized = normalizeBase64(base64);
  const padding = normalized.length % 4;
  const padded = padding === 0 ? normalized : `${normalized}${'='.repeat(4 - padding)}`;
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

function constantTimeEquals(left, right) {
  const leftBytes = bytesFromBase64(left);
  const rightBytes = bytesFromBase64(right);
  if (leftBytes.length !== rightBytes.length) return false;

  let mismatch = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    mismatch |= leftBytes[index] ^ rightBytes[index];
  }
  return mismatch === 0;
}

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeRole(value) {
  return String(value || '').trim().toLowerCase() === 'admin' ? 'admin' : 'member';
}

function normalizeStatus(value) {
  return String(value || '').trim().toLowerCase() === 'draft' ? 'draft' : 'published';
}

function normalizeKind(value) {
  const kind = String(value || '').trim().toLowerCase();
  const allowed = new Set(['page', 'article', 'journal', 'short', 'note', 'landing']);
  return allowed.has(kind) ? kind : 'page';
}

function normalizePageStatusFilter(value) {
  const status = String(value || '').trim().toLowerCase();
  if (status === 'draft') return 'draft';
  if (status === 'published') return 'published';
  return 'all';
}

function formatJournalEntryNumber(value) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number) || number < 1) return '';
  return String(number).padStart(3, '0');
}

function parseJournalEntryNumber(value) {
  const text = String(value || '');
  const patterns = [
    /\[journal-entry:([0-9]{1,6})\]/i,
    /\bJOURNAL\s+ENTRY\s+([0-9]{1,6})\b/i,
    /\bjournal[-_\s]*([0-9]{3,6})\b/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const number = Number.parseInt(match[1], 10);
      if (Number.isFinite(number) && number > 0) return number;
    }
  }

  return null;
}

function stripJournalEntryMarker(value) {
  return String(value || '')
    .replace(/\s*\[journal-entry:[0-9]{1,6}\]\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function addJournalEntryMarker(meta, entryNumber) {
  const cleanMeta = stripJournalEntryMarker(meta);
  const formatted = formatJournalEntryNumber(entryNumber);
  return formatted ? `${cleanMeta} [journal-entry:${formatted}]`.trim() : cleanMeta;
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}

function normalizeMovieTitle(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasMarkdownImages(content) {
  return /!\[[^\]]*]\((.*?)\)/.test(String(content || ''));
}

function stripMarkdownImages(content) {
  return String(content || '').replace(/\n{0,2}!\[[^\]]*]\((.*?)\)\n{0,2}/g, '\n\n').trim();
}

function uniqueMovieTitles(titles) {
  const seen = new Set();
  const unique = [];

  titles.forEach((title) => {
    const cleanTitle = String(title || '').trim();
    const key = normalizeMovieTitle(cleanTitle);
    if (!key || seen.has(key)) return;

    const overlaps = Array.from(seen).some((existing) => (
      existing.startsWith(`${key} `) ||
      existing.endsWith(` ${key}`) ||
      key.startsWith(`${existing} `) ||
      key.endsWith(` ${existing}`)
    ));

    if (overlaps) return;
    seen.add(key);
    unique.push(cleanTitle);
  });

  return unique;
}

function extractMentionedMovieTitles(content) {
  const cleanContent = stripMarkdownImages(content);
  const titles = [];
  const pattern = /(?<!\*)\*([^*\n]{2,100})\*\s*\([^)]*\b(?:19|20)\d{2}\b[^)]*\)/g;
  let match = pattern.exec(cleanContent);

  while (match) {
    const title = String(match[1] || '').trim();
    if (title) titles.push(title);
    match = pattern.exec(cleanContent);
  }

  return uniqueMovieTitles(titles);
}

function selectBestTmdbMovie(results, query) {
  const normalizedQuery = normalizeMovieTitle(query);
  if (!Array.isArray(results) || !results.length) return null;

  return results.reduce((best, result) => {
    const scoreMovie = (movie) => {
      const title = normalizeMovieTitle(movie?.title || movie?.original_title || '');
      let points = 0;
      if (title === normalizedQuery) points += 100;
      else if (title.startsWith(normalizedQuery)) points += 90;
      else if (title.includes(normalizedQuery)) points += 70;
      else if (normalizedQuery.includes(title)) points += 60;
      if (movie?.backdrop_path) points += 5;
      if (movie?.release_date) points += 2;
      points += Number(movie?.popularity || 0) / 100;
      return points;
    };

    return scoreMovie(result) > scoreMovie(best) ? result : best;
  }, results[0]);
}

function tmdbImageUrl(filePath, size = 'w1280') {
  return `https://image.tmdb.org/t/p/${size}${filePath}`;
}

function movieLabel(movie, fallbackTitle) {
  const title = movie?.title || movie?.original_title || fallbackTitle;
  const releaseDate = movie?.release_date || '';
  const year = /^\d{4}/.test(releaseDate) ? releaseDate.slice(0, 4) : '';
  return year ? `${title} (${year})` : title;
}

async function searchTmdbMovie(env, query) {
  if (!env?.TMDB_API_KEY || !query) return null;

  const url = new URL('https://api.themoviedb.org/3/search/movie');
  url.searchParams.set('api_key', env.TMDB_API_KEY);
  url.searchParams.set('query', query);

  try {
    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': 'CINEAST CMS/1.0' }
    });
    if (!response.ok) return null;
    const data = await response.json();
    return selectBestTmdbMovie(data.results || [], query);
  } catch (error) {
    console.warn(`TMDb search failed for "${query}".`, error);
    return null;
  }
}

async function fetchTmdbBackdrops(env, movieId) {
  if (!env?.TMDB_API_KEY || !movieId) return [];

  const url = new URL(`https://api.themoviedb.org/3/movie/${movieId}/images`);
  url.searchParams.set('api_key', env.TMDB_API_KEY);

  try {
    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': 'CINEAST CMS/1.0' }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.backdrops || [])
      .filter((image) => image?.file_path)
      .sort((left, right) => Number(right.vote_average || 0) - Number(left.vote_average || 0))
      .map((image) => image.file_path);
  } catch (error) {
    console.warn(`TMDb images fetch failed for movie ${movieId}.`, error);
    return [];
  }
}

function distributeMovieImages(content, imageItems) {
  if (hasMarkdownImages(content) || !imageItems.length) return content;

  const paragraphs = String(content || '').split('\n\n');
  if (paragraphs.length < 4) {
    return `${content}\n\n${imageItems.map((item) => `![${item.label}](${item.url})`).join('\n\n')}`;
  }

  imageItems
    .map((item, index) => ({
      position: Math.floor(((index + 1) * paragraphs.length) / (imageItems.length + 1)),
      markdown: `![${item.label}](${item.url})`
    }))
    .sort((left, right) => right.position - left.position)
    .forEach((item) => {
      paragraphs.splice(item.position, 0, item.markdown);
    });

  return paragraphs.join('\n\n');
}

async function enrichJournalPagePayload(env, payload) {
  if (normalizeKind(payload.kind) !== 'journal') return payload;
  if (!payload.content || hasMarkdownImages(payload.content)) return payload;
  if (!env?.TMDB_API_KEY) return payload;

  const movieTitles = extractMentionedMovieTitles(payload.content);
  if (!movieTitles.length) return payload;

  const stillsPerMovie = movieTitles.length === 1 ? 3 : 1;
  const imageItems = [];

  for (const title of movieTitles) {
    const movie = await searchTmdbMovie(env, title);
    if (!movie?.id) continue;

    const backdrops = (await fetchTmdbBackdrops(env, movie.id)).slice(0, stillsPerMovie);
    const label = movieLabel(movie, title);
    backdrops.forEach((filePath) => {
      imageItems.push({
        label,
        url: tmdbImageUrl(filePath)
      });
    });
  }

  if (!imageItems.length) return payload;

  return {
    ...payload,
    content: distributeMovieImages(payload.content, imageItems),
    heroImage: payload.heroImage || payload.hero_image || imageItems[0].url,
    hero_image: payload.hero_image || payload.heroImage || imageItems[0].url
  };
}

function excerptFromContent(content, maxLength = 160) {
  const text = String(content || '')
    .replace(/!\[[^\]]*\]\((.*?)\)/g, ' ')
    .replace(/\[([^\]]+)\]\((.*?)\)/g, '$1')
    .replace(/[#>*_`-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
}

function sanitizePage(page, { includeContent = true } = {}) {
  if (!page) return null;
  const entryNumber = parseJournalEntryNumber(`${page.meta || ''} ${page.slug || ''} ${page.id || ''}`);
  const payload = {
    id: page.id,
    slug: page.slug,
    title: page.title,
    meta: stripJournalEntryMarker(page.meta || ''),
    entry_number: entryNumber ? formatJournalEntryNumber(entryNumber) : '',
    summary: page.summary || '',
    hero_image: page.hero_image || '',
    kind: page.kind || 'page',
    status: page.status || 'published',
    content: page.content,
    created_by: page.created_by || null,
    updated_by: page.updated_by || null,
    published_at: page.published_at || null,
    created_at: page.created_at,
    updated_at: page.updated_at,
    excerpt: page.summary || excerptFromContent(page.content)
  };

  if (includeContent) {
    payload.content = page.content;
  }

  return payload;
}

function isHttpsRequest(request) {
  return new URL(request.url).protocol === 'https:';
}

function ensureDb(env) {
  if (!env?.DB) {
    return errorResponse('Missing D1 binding: DB', 500);
  }
  return null;
}

function ensureSessions(env) {
  if (!env?.KV_SESSIONS) {
    return errorResponse('Missing KV binding: KV_SESSIONS', 500);
  }
  return null;
}

async function getDatabaseHealth(env) {
  const bindingError = ensureDb(env);
  if (bindingError) {
    return {
      db: false,
      error: 'Missing D1 binding: DB'
    };
  }

  try {
    await env.DB.prepare('SELECT 1 AS ok').first();
    return { db: true };
  } catch (error) {
    return {
      db: false,
      error: error?.message || 'Unable to reach D1'
    };
  }
}

async function parseJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function hashPassword(password, saltBase64) {
  const salt = bytesFromBase64(saltBase64);
  const passwordBytes = textEncoder.encode(password);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PASSWORD_HASH_ITERATIONS,
      hash: 'SHA-256'
    },
    baseKey,
    PASSWORD_HASH_BITS
  );

  return base64FromBytes(new Uint8Array(derivedBits));
}

async function createPasswordRecord(password) {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const saltBase64 = base64FromBytes(salt);
  const hash = await hashPassword(password, saltBase64);
  return { password_hash: hash, password_salt: saltBase64 };
}

async function verifyPassword(password, user) {
  if (!user?.password_hash || !user?.password_salt) return false;
  const hash = await hashPassword(password, user.password_salt);
  return constantTimeEquals(hash, user.password_hash);
}

async function createSession(env, userId) {
  if (!env?.KV_SESSIONS || typeof env.KV_SESSIONS.put !== 'function') {
    throw new Error('KV session store is not available');
  }

  const token = crypto.randomUUID();
  await env.KV_SESSIONS.put(token, userId, { expirationTtl: SESSION_TTL_SECONDS });
  return token;
}

function parseBooleanSetting(value, defaultValue = false) {
  if (value === null || value === undefined) return defaultValue;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return defaultValue;
}

function normalizeTagOverrideGroup(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const result = [];

  value.forEach((item) => {
    const clean = String(item || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (!clean || clean.length > 80 || seen.has(clean)) return;
    seen.add(clean);
    result.push(clean);
  });

  return result.sort();
}

function normalizeTagOverrides(value) {
  const source = value && typeof value === 'object' ? value : {};
  const categories = ['all', 'directors', 'actors', 'movies', 'genres', 'tags'];
  const hiddenSource = source.hidden && typeof source.hidden === 'object' ? source.hidden : {};
  const addedSource = source.added && typeof source.added === 'object' ? source.added : {};

  return {
    hidden: Object.fromEntries(categories.map((category) => [category, normalizeTagOverrideGroup(hiddenSource[category])])),
    added: Object.fromEntries(categories.map((category) => [category, normalizeTagOverrideGroup(addedSource[category])])),
    updated_at: source.updated_at || null
  };
}

async function getSearchTagOverrides(env) {
  const raw = await getSetting(env, SEARCH_TAG_OVERRIDES_SETTING_KEY, '');
  if (!raw) return normalizeTagOverrides(null);

  try {
    return normalizeTagOverrides(JSON.parse(raw));
  } catch {
    return normalizeTagOverrides(null);
  }
}

async function getSetting(env, key, defaultValue = null) {
  const row = await env.DB.prepare(
    `SELECT value
     FROM settings
     WHERE key = ?`
  )
    .bind(key)
    .first();

  return row?.value ?? defaultValue;
}

async function setSetting(env, key, value) {
  await env.DB.prepare(
    `INSERT INTO settings (key, value, updated_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       updated_at = CURRENT_TIMESTAMP`
  )
    .bind(key, String(value))
    .run();
}

async function getAuthSettings(env) {
  const inviteOnly = parseBooleanSetting(await getSetting(env, INVITE_ONLY_SETTING_KEY, '0'), false);
  return {
    invite_only: inviteOnly,
    registration_open: !inviteOnly
  };
}

async function getHighestCmsJournalEntryNumber(env) {
  const rows = await env.DB.prepare(
    `SELECT slug, meta
     FROM pages
     WHERE kind = 'journal'`
  )
    .all();

  let unnumberedCount = 0;
  const highestNumber = (rows.results || []).reduce((highest, page) => {
    const number = parseJournalEntryNumber(`${page.meta || ''} ${page.slug || ''}`);
    if (!number) unnumberedCount += 1;
    return number && number > highest ? number : highest;
  }, 0);

  return Math.max(highestNumber, STATIC_JOURNAL_ENTRY_FLOOR + unnumberedCount);
}

async function reserveJournalEntryNumber(env) {
  const storedCounter = Number.parseInt(await getSetting(env, JOURNAL_ENTRY_COUNTER_SETTING_KEY, '0'), 10);
  const cmsCounter = await getHighestCmsJournalEntryNumber(env);
  const baseline = Math.max(
    STATIC_JOURNAL_ENTRY_FLOOR,
    Number.isFinite(storedCounter) ? storedCounter : 0,
    cmsCounter
  );
  const nextNumber = baseline + 1;
  await setSetting(env, JOURNAL_ENTRY_COUNTER_SETTING_KEY, String(nextNumber));
  return nextNumber;
}

async function deleteSession(env, token) {
  if (!token) return;
  await env.KV_SESSIONS.delete(token);
}

async function getCurrentUser(request, env) {
  const bindingError = ensureSessions(env) || ensureDb(env);
  if (bindingError) return null;

  const token = getRequestToken(request);
  if (!token) return null;

  const userId = await env.KV_SESSIONS.get(token);
  if (!userId) return null;

  const user = await env.DB.prepare(
    `SELECT id, username, role, created_at, updated_at
     FROM users
     WHERE id = ?`
  )
    .bind(userId)
    .first();

  return sanitizeUser(user);
}

async function requireUser(request, env, allowedRoles = []) {
  const user = await getCurrentUser(request, env);
  if (!user) {
    return { error: errorResponse('Unauthorized', 401) };
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return { error: errorResponse('Forbidden', 403) };
  }

  return { user };
}

async function countAdmins(env) {
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS count
     FROM users
     WHERE role = 'admin'`
  ).first();

  return Number(row?.count || 0);
}

async function fetchUserByUsername(env, username) {
  return env.DB.prepare(
    `SELECT id, username, role, password_hash, password_salt, created_at, updated_at
     FROM users
     WHERE username = ?`
  )
    .bind(username)
    .first();
}

async function fetchUserById(env, id) {
  return env.DB.prepare(
    `SELECT id, username, role, created_at, updated_at
     FROM users
     WHERE id = ?`
  )
    .bind(id)
    .first();
}

async function fetchPageByKey(env, key) {
  return env.DB.prepare(
    `SELECT id, slug, title, meta, summary, hero_image, content, kind, status,
            created_by, updated_by, published_at, created_at, updated_at
     FROM pages
     WHERE id = ? OR slug = ?
     LIMIT 1`
  )
    .bind(key, key)
    .first();
}

function isPublished(page) {
  return String(page?.status || '').toLowerCase() === 'published';
}

async function canReadPage(request, env, page) {
  const user = await getCurrentUser(request, env);
  if (!page) return false;
  if (user?.role === 'admin') return true;
  return isPublished(page);
}

async function handleLogin(request, env) {
  try {
    const dbError = ensureDb(env) || ensureSessions(env);
    if (dbError) return dbError;

    const body = await parseJsonBody(request);
    if (!body) return errorResponse('Invalid JSON body', 400);

    const username = normalizeUsername(body.username);
    const password = String(body.password || '');

    if (!username || !password) {
      return errorResponse('Username and password are required', 400);
    }

    const user = await fetchUserByUsername(env, username);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const passwordOk = await verifyPassword(password, user);
    if (!passwordOk) {
      return errorResponse('Unauthorized', 401);
    }

    const token = await createSession(env, user.id);
    const responseUser = sanitizeUser(user);
    const secure = isHttpsRequest(request);

    return okResponse(
      {
        success: true,
        token,
        user: responseUser
      },
      {
        headers: {
          'Set-Cookie': setCookie(SESSION_COOKIE_NAME, token, {
            maxAge: SESSION_TTL_SECONDS,
            secure
          })
        }
      }
    );
  } catch (error) {
    console.error('Login failed', error);
    return errorResponse('Login failed', 500, {
      reason: error?.message || 'Unexpected login error'
    });
  }
}

async function handleRegister(request, env) {
  try {
    const dbError = ensureDb(env) || ensureSessions(env);
    if (dbError) return dbError;

    const authSettings = await getAuthSettings(env);
    if (authSettings.invite_only) {
      return errorResponse('Registration is invite-only.', 403, {
        invite_only: true,
        registration_open: false
      });
    }

    const body = await parseJsonBody(request);
    if (!body) return errorResponse('Invalid JSON body', 400);

    const username = normalizeUsername(body.username);
    const password = String(body.password || '');

    if (!username || password.length < 8) {
      return errorResponse('Username and password (8+ chars) are required', 400);
    }

    const existing = await fetchUserByUsername(env, username);
    if (existing) {
      return errorResponse('Username already exists', 409);
    }

    const id = crypto.randomUUID();
    const record = await createPasswordRecord(password);

    await env.DB.prepare(
      `INSERT INTO users (id, username, password_hash, password_salt, role)
       VALUES (?, ?, ?, ?, 'member')`
    )
      .bind(id, username, record.password_hash, record.password_salt)
      .run();

    try {
      const user = await fetchUserById(env, id);
      const token = await createSession(env, id);
      const secure = isHttpsRequest(request);

      return okResponse(
        {
          success: true,
          token,
          user
        },
        {
          status: 201,
          headers: {
            'Set-Cookie': setCookie(SESSION_COOKIE_NAME, token, {
              maxAge: SESSION_TTL_SECONDS,
              secure
            })
          }
        }
      );
    } catch (error) {
      await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run().catch(() => {});
      throw error;
    }
  } catch (error) {
    console.error('Registration failed', error);
    return errorResponse('Registration failed', 500, {
      reason: error?.message || 'Unexpected registration error'
    });
  }
}

async function handleGetAuthSettings(request, env) {
  const dbError = ensureDb(env);
  if (dbError) return dbError;

  return okResponse(await getAuthSettings(env));
}

async function handleAdminSettings(request, env) {
  const dbError = ensureDb(env);
  if (dbError) return dbError;

  const auth = await requireUser(request, env, ['admin']);
  if (auth.error) return auth.error;

  if (request.method === 'GET') {
    return okResponse(await getAuthSettings(env));
  }

  if (request.method !== 'PATCH' && request.method !== 'PUT') {
    return errorResponse('Method not allowed', 405);
  }

  const body = await parseJsonBody(request);
  if (!body) return errorResponse('Invalid JSON body', 400);

  if (body.invite_only === undefined) {
    return errorResponse('invite_only is required', 400);
  }

  const inviteOnly = Boolean(body.invite_only);
  await setSetting(env, INVITE_ONLY_SETTING_KEY, inviteOnly ? '1' : '0');
  return okResponse(await getAuthSettings(env));
}

async function handleAdminTagOverrides(request, env) {
  const dbError = ensureDb(env);
  if (dbError) return dbError;

  const auth = await requireUser(request, env, ['admin']);
  if (auth.error) return auth.error;

  if (request.method === 'GET') {
    return okResponse({ overrides: await getSearchTagOverrides(env) });
  }

  if (request.method !== 'PATCH' && request.method !== 'PUT') {
    return errorResponse('Method not allowed', 405);
  }

  const body = await parseJsonBody(request);
  if (!body) return errorResponse('Invalid JSON body', 400);

  const overrides = normalizeTagOverrides({
    ...body,
    updated_at: new Date().toISOString()
  });

  await setSetting(env, SEARCH_TAG_OVERRIDES_SETTING_KEY, JSON.stringify(overrides));
  return okResponse({ overrides });
}

async function handleGetTagOverrides(request, env) {
  const dbError = ensureDb(env);
  if (dbError) return dbError;

  return okResponse({ overrides: await getSearchTagOverrides(env) });
}

async function handleLogout(request, env) {
  const sessionsError = ensureSessions(env);
  if (sessionsError) return sessionsError;

  const token = getRequestToken(request);
  if (token) {
    await deleteSession(env, token);
  }

  return okResponse(
    { success: true },
    {
      headers: {
        'Set-Cookie': setCookie(SESSION_COOKIE_NAME, '', {
          maxAge: 0,
          secure: isHttpsRequest(request)
        })
      }
    }
  );
}

async function handleMe(request, env) {
  const bindingError = ensureDb(env) || ensureSessions(env);
  if (bindingError) return bindingError;

  const auth = await requireUser(request, env);
  if (auth.error) return auth.error;
  return okResponse({ user: auth.user });
}

async function handleBootstrapAdmin(request, env) {
  const dbError = ensureDb(env) || ensureSessions(env);
  if (dbError) return dbError;

  if (!env.BOOTSTRAP_ADMIN_TOKEN) {
    return errorResponse('Missing bootstrap token secret', 500);
  }

  const countRow = await env.DB.prepare('SELECT COUNT(*) AS count FROM users').first();
  const userCount = Number(countRow?.count || 0);

  if (request.method === 'GET') {
    return okResponse({
      configured: true,
      completed: userCount > 0,
      available: userCount === 0
    });
  }

  const headerToken =
    request.headers.get('X-Bootstrap-Token') ||
    (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();

  if (!headerToken || headerToken !== env.BOOTSTRAP_ADMIN_TOKEN) {
    return errorResponse('Unauthorized', 401);
  }

  if (userCount > 0) {
    return errorResponse('Bootstrap already completed', 409);
  }

  const body = await parseJsonBody(request);
  if (!body) return errorResponse('Invalid JSON body', 400);

  const username = normalizeUsername(body.username);
  const password = String(body.password || '');

  if (!username || password.length < 8) {
    return errorResponse('Username and password (8+ chars) are required', 400);
  }

  const id = crypto.randomUUID();
  const record = await createPasswordRecord(password);
  await env.DB.prepare(
    `INSERT INTO users (id, username, password_hash, password_salt, role)
     VALUES (?, ?, ?, ?, 'admin')`
  )
    .bind(id, username, record.password_hash, record.password_salt)
    .run();

  const user = await fetchUserById(env, id);
  return okResponse({ success: true, user });
}

async function handleListUsers(request, env) {
  const bindingError = ensureDb(env);
  if (bindingError) return bindingError;

  const auth = await requireUser(request, env, ['admin']);
  if (auth.error) return auth.error;

  const rows = await env.DB.prepare(
    `SELECT id, username, role, created_at, updated_at
     FROM users
     ORDER BY created_at ASC`
  ).all();

  return okResponse({ users: rows.results || [] });
}

async function handleCreateUser(request, env) {
  const bindingError = ensureDb(env);
  if (bindingError) return bindingError;

  const auth = await requireUser(request, env, ['admin']);
  if (auth.error) return auth.error;

  const body = await parseJsonBody(request);
  if (!body) return errorResponse('Invalid JSON body', 400);

  const username = normalizeUsername(body.username);
  const password = String(body.password || '');
  const role = normalizeRole(body.role);

  if (!username || password.length < 8) {
    return errorResponse('Username and password (8+ chars) are required', 400);
  }

  const id = crypto.randomUUID();
  const record = await createPasswordRecord(password);

  try {
    await env.DB.prepare(
      `INSERT INTO users (id, username, password_hash, password_salt, role)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(id, username, record.password_hash, record.password_salt, role)
      .run();
  } catch (error) {
    if (String(error?.message || '').toLowerCase().includes('unique')) {
      return errorResponse('Username already exists', 409);
    }
    throw error;
  }

  const user = await fetchUserById(env, id);
  return okResponse({ success: true, user }, { status: 201 });
}

async function handleUpdateUser(request, env, userId) {
  const bindingError = ensureDb(env);
  if (bindingError) return bindingError;

  const auth = await requireUser(request, env, ['admin']);
  if (auth.error) return auth.error;

  const existing = await env.DB.prepare(
    `SELECT id, username, role, password_hash, password_salt
     FROM users
     WHERE id = ?`
  )
    .bind(userId)
    .first();

  if (!existing) {
    return errorResponse('User not found', 404);
  }

  const body = await parseJsonBody(request);
  if (!body) return errorResponse('Invalid JSON body', 400);

  const nextUsername = body.username ? normalizeUsername(body.username) : existing.username;
  const nextRole = body.role ? normalizeRole(body.role) : existing.role;
  const nextPassword = body.password ? String(body.password) : '';

  if (!nextUsername) return errorResponse('Username is required', 400);
  if (body.password && nextPassword.length < 8) {
    return errorResponse('Password must be at least 8 characters', 400);
  }

  if (existing.role === 'admin' && nextRole !== 'admin') {
    const adminCount = await countAdmins(env);
    if (adminCount <= 1) {
      return errorResponse('Cannot demote the last admin user', 409);
    }
  }

  const passwordRecord = nextPassword ? await createPasswordRecord(nextPassword) : null;

  try {
    await env.DB.prepare(
      `UPDATE users
       SET username = ?,
           role = ?,
           password_hash = COALESCE(?, password_hash),
           password_salt = COALESCE(?, password_salt),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
      .bind(
        nextUsername,
        nextRole,
        passwordRecord?.password_hash || null,
        passwordRecord?.password_salt || null,
        userId
      )
      .run();
  } catch (error) {
    if (String(error?.message || '').toLowerCase().includes('unique')) {
      return errorResponse('Username already exists', 409);
    }
    throw error;
  }

  const user = await fetchUserById(env, userId);
  return okResponse({ success: true, user });
}

async function handleDeleteUser(request, env, userId) {
  const bindingError = ensureDb(env);
  if (bindingError) return bindingError;

  const auth = await requireUser(request, env, ['admin']);
  if (auth.error) return auth.error;

  const target = await env.DB.prepare(
    `SELECT id, role
     FROM users
     WHERE id = ?`
  )
    .bind(userId)
    .first();

  if (!target) return errorResponse('User not found', 404);

  if (target.role === 'admin') {
    const adminCount = await countAdmins(env);
    if (adminCount <= 1) {
      return errorResponse('Cannot delete the last admin user', 409);
    }
  }

  await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
  return okResponse({ success: true });
}

async function handlePagesList(request, env) {
  const bindingError = ensureDb(env);
  if (bindingError) return bindingError;

  const user = await getCurrentUser(request, env);
  const url = new URL(request.url);
  const includeDrafts = url.searchParams.get('includeDrafts') === '1' || url.searchParams.get('status') === 'all';
  const statusFilter = normalizePageStatusFilter(url.searchParams.get('status'));
  const requestedLimit = Number(url.searchParams.get('limit'));
  const limit = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(requestedLimit, 200))
    : DEFAULT_PAGE_LIMIT;

  const canShowDrafts = Boolean(user?.role === 'admin' && includeDrafts);
  const statusClause = canShowDrafts && statusFilter !== 'all'
    ? 'WHERE status = ?'
    : canShowDrafts
      ? ''
      : "WHERE status = 'published'";
  const bindValues = canShowDrafts && statusFilter !== 'all' ? [statusFilter, limit] : [limit];
  const rows = await env.DB.prepare(
    `SELECT id, slug, title, meta, summary, hero_image, kind, status, created_by, updated_by,
            published_at, created_at, updated_at, content
     FROM pages
     ${statusClause}
     ORDER BY updated_at DESC
     LIMIT ?`
  )
    .bind(...bindValues)
    .all();

  const pages = (rows.results || []).map((page) => sanitizePage(page, { includeContent: false }));
  return okResponse({ pages });
}

async function handlePageCreate(request, env) {
  const bindingError = ensureDb(env);
  if (bindingError) return bindingError;

  const auth = await requireUser(request, env, ['admin']);
  if (auth.error) return auth.error;

  const body = await parseJsonBody(request);
  if (!body) return errorResponse('Invalid JSON body', 400);

  const title = String(body.title || '').trim();
  const content = String(body.content || '').trim();
  const meta = String(body.meta || '').trim();
  const summary = String(body.summary || '').trim();
  const heroImage = String(body.hero_image || body.heroImage || '').trim();
  const kind = normalizeKind(body.kind);
  const status = normalizeStatus(body.status);
  const explicitSlug = String(body.slug || '').trim();
  const slugBase = explicitSlug || slugify(title);

  if (!title) return errorResponse('Title is required', 400);
  if (!content) return errorResponse('Content is required', 400);

  const id = crypto.randomUUID();
  const slug = slugBase || `page-${id.slice(0, 8)}`;
  const journalEntryNumber = kind === 'journal'
    ? parseJournalEntryNumber(`${body.entry_number || ''} ${meta} ${explicitSlug}`) || await reserveJournalEntryNumber(env)
    : null;
  const storedMeta = kind === 'journal' && journalEntryNumber
    ? addJournalEntryMarker(meta, journalEntryNumber)
    : meta;
  const shouldAutoEnrich = body.auto_enrich !== false;
  const basePayload = {
    title,
    content,
    meta: storedMeta,
    summary,
    heroImage,
    hero_image: heroImage,
    kind,
    status
  };
  const enrichedPayload = shouldAutoEnrich
    ? await enrichJournalPagePayload(env, basePayload)
    : basePayload;
  const enrichedContent = String(enrichedPayload.content || content).trim();
  const enrichedHeroImage = String(enrichedPayload.heroImage || enrichedPayload.hero_image || heroImage || '').trim();

  try {
    await env.DB.prepare(
      `INSERT INTO pages (
        id, slug, title, meta, summary, hero_image, content, kind, status,
        created_by, updated_by, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 'published' THEN CURRENT_TIMESTAMP ELSE NULL END)`
    )
      .bind(
        id,
        slug,
        title,
        storedMeta || null,
        summary || null,
        enrichedHeroImage || null,
        enrichedContent,
        kind,
        status,
        auth.user.id,
        auth.user.id,
        status
      )
      .run();
  } catch (error) {
    const message = String(error?.message || '').toLowerCase();
    if (message.includes('unique')) {
      return errorResponse('Slug already exists', 409);
    }
    throw error;
  }

  const page = await fetchPageByKey(env, slug);
  return okResponse({ success: true, page: sanitizePage(page) }, { status: 201 });
}

async function handlePagesSearch(request, env) {
  const bindingError = ensureDb(env);
  if (bindingError) return bindingError;

  const user = await getCurrentUser(request, env);
  const url = new URL(request.url);
  const query = String(url.searchParams.get('q') || '').trim();
  const includeDrafts = url.searchParams.get('includeDrafts') === '1' || url.searchParams.get('status') === 'all';
  const statusFilter = normalizePageStatusFilter(url.searchParams.get('status'));
  const requestedLimit = Number(url.searchParams.get('limit'));
  const limit = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(requestedLimit, 50))
    : 10;
  const canShowDrafts = Boolean(user?.role === 'admin' && includeDrafts);
  const statusClause = canShowDrafts && statusFilter !== 'all'
    ? 'AND status = ?'
    : canShowDrafts
      ? ''
      : "AND status = 'published'";

  if (!query) {
    const bindValues = canShowDrafts && statusFilter !== 'all' ? [statusFilter, limit] : [limit];
    const rows = await env.DB.prepare(
      `SELECT id, slug, title, meta, summary, hero_image, kind, status, created_by, updated_by,
              published_at, created_at, updated_at, content
       FROM pages
       WHERE 1 = 1
       ${statusClause}
       ORDER BY updated_at DESC
       LIMIT ?`
    )
      .bind(...bindValues)
      .all();

    return okResponse({ results: (rows.results || []).map((page) => sanitizePage(page, { includeContent: false })) });
  }

  const likeQuery = `%${query}%`;
  const bindValues = canShowDrafts && statusFilter !== 'all'
    ? [likeQuery, likeQuery, likeQuery, likeQuery, statusFilter, limit]
    : [likeQuery, likeQuery, likeQuery, likeQuery, limit];
  const rows = await env.DB.prepare(
    `SELECT id, slug, title, meta, summary, hero_image, kind, status, created_by, updated_by,
            published_at, created_at, updated_at, content
     FROM pages
     WHERE (title LIKE ? OR meta LIKE ? OR summary LIKE ? OR content LIKE ?)
     ${statusClause}
     ORDER BY updated_at DESC
     LIMIT ?`
  )
    .bind(...bindValues)
    .all();

  return okResponse({ results: (rows.results || []).map((page) => sanitizePage(page, { includeContent: false })) });
}

function cmsPageToSearchResult(page) {
  const safePage = sanitizePage(page, { includeContent: false });
  const imageMatch = String(page.content || '').match(/!\[[^\]]*]\((.*?)\)/);
  const url = safePage.kind === 'journal'
    ? `/article.html?id=${encodeURIComponent(safePage.slug || safePage.id)}`
    : `/${safePage.slug || safePage.id}`;

  return {
    id: safePage.id,
    slug: safePage.slug,
    title: safePage.title,
    excerpt: safePage.excerpt,
    meta: safePage.meta,
    kind: safePage.kind,
    status: safePage.status,
    url,
    image: safePage.hero_image || imageMatch?.[1] || '',
    source: 'cms',
    platform: safePage.kind === 'journal' ? 'journal' : 'page',
    entry_number: safePage.entry_number || '',
    updated_at: safePage.updated_at
  };
}

async function handleGlobalSearch(request, env) {
  const bindingError = ensureDb(env);
  if (bindingError) return bindingError;

  const url = new URL(request.url);
  const query = String(url.searchParams.get('q') || '').trim();
  const requestedLimit = Number(url.searchParams.get('limit'));
  const limit = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(requestedLimit, 50))
    : 12;

  if (!query) {
    return okResponse({ results: [] });
  }

  // Sanitize query for FTS5 MATCH — escape special chars and wrap in quotes for phrase matching
  const sanitizeFtsQuery = (q) => {
    // Remove FTS5 special operators, then wrap in double quotes for safe phrase matching
    const cleaned = q.replace(/["*^()OR AND NOT:]/g, ' ').replace(/\s+/g, ' ').trim();
    // Build a prefix query: each word gets a * suffix for partial matching
    return cleaned.split(/\s+/).filter(Boolean).map(w => `"${w}"*`).join(' ');
  };

  let rows = null;
  let usedFts = false;

  try {
    // Attempt FTS5 search with BM25 relevance ranking
    const ftsQuery = sanitizeFtsQuery(query);
    const ftsRows = await env.DB.prepare(
      `SELECT p.id, p.slug, p.title, p.meta, p.summary, p.hero_image, p.kind, p.status,
              p.created_by, p.updated_by, p.published_at, p.created_at, p.updated_at, p.content,
              snippet(pages_fts, 5, '<mark>', '</mark>', '...', 24) AS fts_snippet,
              bm25(pages_fts) AS rank
       FROM pages_fts
       JOIN pages p ON p.id = pages_fts.id
       WHERE pages_fts MATCH ?
         AND p.status = 'published'
       ORDER BY rank
       LIMIT ?`
    )
      .bind(ftsQuery, limit)
      .all();

    if (ftsRows && ftsRows.results && ftsRows.results.length > 0) {
      rows = ftsRows;
      usedFts = true;
    }
  } catch (_ftsErr) {
    // FTS5 table may not exist yet (pre-migration) — fall through to LIKE fallback
  }

  if (!usedFts) {
    // Fallback: LIKE-based search ordered by recency
    const likeQuery = `%${query}%`;
    rows = await env.DB.prepare(
      `SELECT id, slug, title, meta, summary, hero_image, kind, status, created_by, updated_by,
              published_at, created_at, updated_at, content,
              NULL AS fts_snippet
       FROM pages
       WHERE status = 'published'
         AND (title LIKE ? OR meta LIKE ? OR summary LIKE ? OR content LIKE ? OR slug LIKE ?)
       ORDER BY updated_at DESC
       LIMIT ?`
    )
      .bind(likeQuery, likeQuery, likeQuery, likeQuery, likeQuery, limit)
      .all();
  }

  const results = (rows?.results || []).map((page) => {
    const result = cmsPageToSearchResult(page);
    // If we have an FTS snippet, use it as the excerpt (it has highlighted terms)
    if (page.fts_snippet) {
      result.excerpt = page.fts_snippet.replace(/<\/?mark>/g, '');
      result.snippet = page.fts_snippet;
    }
    return result;
  });

  return okResponse({ results, fts: usedFts });
}

async function handleSearchWarmup(request, env) {
  const bindingError = ensureDb(env);
  if (bindingError) return bindingError;

  try {
    // Return a lightweight snapshot of all published pages for frontend preloading
    const rows = await env.DB.prepare(
      `SELECT slug, title, meta, kind, hero_image, summary, published_at, updated_at
       FROM pages
       WHERE status = 'published'
       ORDER BY updated_at DESC
       LIMIT 200`
    ).all();

    const pages = (rows.results || []).map(p => ({
      slug: p.slug,
      title: p.title,
      meta: p.meta || '',
      kind: p.kind,
      image: p.hero_image || '',
      excerpt: p.summary || '',
      published_at: p.published_at || p.updated_at || ''
    }));

    const response = okResponse({ pages, count: pages.length, ts: Date.now() });
    // Cache for 60 seconds on CDN / browser
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    return new Response(response.body, { status: response.status, headers });
  } catch (err) {
    return okResponse({ pages: [], count: 0, error: err?.message || 'warmup failed' });
  }
}

async function handlePageByKey(request, env, key) {
  const bindingError = ensureDb(env);
  if (bindingError) return bindingError;

  const page = await fetchPageByKey(env, key);
  if (!page) return errorResponse('Page not found', 404);

  const allowed = await canReadPage(request, env, page);
  if (!allowed) return errorResponse('Page not found', 404);

  return okResponse({ page: sanitizePage(page) });
}

async function handlePageUpdate(request, env, key) {
  const bindingError = ensureDb(env);
  if (bindingError) return bindingError;

  const auth = await requireUser(request, env, ['admin']);
  if (auth.error) return auth.error;

  const existing = await fetchPageByKey(env, key);
  if (!existing) return errorResponse('Page not found', 404);

  const body = await parseJsonBody(request);
  if (!body) return errorResponse('Invalid JSON body', 400);

  const title = body.title !== undefined ? String(body.title || '').trim() : existing.title;
  const content = body.content !== undefined ? String(body.content || '').trim() : existing.content;
  const meta = body.meta !== undefined ? String(body.meta || '').trim() : (existing.meta || '');
  const summary = body.summary !== undefined ? String(body.summary || '').trim() : (existing.summary || '');
  const heroImage = body.hero_image !== undefined || body.heroImage !== undefined
    ? String(body.hero_image || body.heroImage || '').trim()
    : (existing.hero_image || '');
  const kind = body.kind !== undefined ? normalizeKind(body.kind) : normalizeKind(existing.kind);
  const status = body.status !== undefined ? normalizeStatus(body.status) : normalizeStatus(existing.status);
  const slug = body.slug !== undefined ? String(body.slug || '').trim() : existing.slug;

  if (!title) return errorResponse('Title is required', 400);
  if (!content) return errorResponse('Content is required', 400);

  const journalEntryNumber = kind === 'journal'
    ? parseJournalEntryNumber(`${body.entry_number || ''} ${meta} ${slug}`) ||
      parseJournalEntryNumber(`${existing.meta || ''} ${existing.slug || ''} ${existing.id || ''}`) ||
      await reserveJournalEntryNumber(env)
    : null;
  const storedMeta = kind === 'journal' && journalEntryNumber
    ? addJournalEntryMarker(meta, journalEntryNumber)
    : stripJournalEntryMarker(meta);

  const shouldAutoEnrich = body.auto_enrich !== false;
  const basePayload = {
    title,
    content,
    meta: storedMeta,
    summary,
    heroImage,
    hero_image: heroImage,
    kind,
    status
  };
  const enrichedPayload = shouldAutoEnrich
    ? await enrichJournalPagePayload(env, basePayload)
    : basePayload;
  const enrichedContent = String(enrichedPayload.content || content).trim();
  const enrichedHeroImage = String(enrichedPayload.heroImage || enrichedPayload.hero_image || heroImage || '').trim();

  try {
    await env.DB.prepare(
      `UPDATE pages
       SET slug = ?,
           title = ?,
           meta = ?,
           summary = ?,
           hero_image = ?,
           content = ?,
           kind = ?,
           status = ?,
           updated_by = ?,
           published_at = CASE
             WHEN ? = 'published' AND published_at IS NULL THEN CURRENT_TIMESTAMP
             ELSE published_at
           END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? OR slug = ?`
    )
      .bind(
        slug || existing.slug,
        title,
        storedMeta || null,
        summary || null,
        enrichedHeroImage || null,
        enrichedContent,
        kind,
        status,
        auth.user.id,
        status,
        key,
        key
      )
      .run();
  } catch (error) {
    const message = String(error?.message || '').toLowerCase();
    if (message.includes('unique')) {
      return errorResponse('Slug already exists', 409);
    }
    throw error;
  }

  const page = await fetchPageByKey(env, slug || key);
  return okResponse({ success: true, page: sanitizePage(page) });
}

async function handlePageDelete(request, env, key) {
  const bindingError = ensureDb(env);
  if (bindingError) return bindingError;

  const auth = await requireUser(request, env, ['admin']);
  if (auth.error) return auth.error;

  const existing = await fetchPageByKey(env, key);
  if (!existing) return errorResponse('Page not found', 404);

  await env.DB.prepare('DELETE FROM pages WHERE id = ? OR slug = ?').bind(key, key).run();
  return okResponse({ success: true });
}

async function handleAdminUserById(request, env, userId) {
  if (request.method === 'PATCH' || request.method === 'PUT') {
    return handleUpdateUser(request, env, userId);
  }

  if (request.method === 'DELETE') {
    return handleDeleteUser(request, env, userId);
  }

  if (request.method === 'GET') {
    const auth = await requireUser(request, env, ['admin']);
    if (auth.error) return auth.error;

    const user = await fetchUserById(env, userId);
    if (!user) return errorResponse('User not found', 404);
    return okResponse({ user });
  }

  return errorResponse('Method not allowed', 405);
}

let tvdbToken = null;
async function getTvdbToken(env) {
  if (tvdbToken) return tvdbToken;
  if (!env?.TVDB_API_KEY) {
    throw new Error('TVDB API key not configured');
  }
  const response = await fetch('https://api4.thetvdb.com/v4/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'CINEAST CMS/1.0' },
    body: JSON.stringify({ apikey: env.TVDB_API_KEY })
  });
  if (!response.ok) {
    throw new Error(`TVDB login failed: ${response.status}`);
  }
  const payload = await response.json();
  tvdbToken = payload?.data?.token || null;
  return tvdbToken;
}

async function handleTvdbSearch(request, env) {
  const auth = await requireUser(request, env, ['admin']);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const query = String(url.searchParams.get('query') || '').trim();
  if (!query) {
    return okResponse({ results: [] });
  }

  if (!env?.TVDB_API_KEY) {
    return errorResponse('TVDB integration not configured on server', 500);
  }

  try {
    const token = await getTvdbToken(env);
    const searchUrl = `https://api4.thetvdb.com/v4/search?query=${encodeURIComponent(query)}&type=series`;
    const res = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'User-Agent': 'CINEAST CMS/1.0'
      }
    });
    if (!res.ok) {
      return errorResponse('Failed to fetch from TVDB', res.status);
    }
    const payload = await res.json();
    const results = (payload.data || []).map(show => {
      // Find year
      const year = show.year || '';
      return {
        id: show.tvdb_id || show.id,
        title: show.name || '',
        year: year,
        poster_path: show.image_url || show.thumbnail || show.poster || null,
        overview: show.overview || ''
      };
    });
    return okResponse({ results });
  } catch (error) {
    console.error('TVDB search failed:', error);
    return errorResponse(error.message || 'TVDB search failed', 500);
  }
}

async function handleTvdbImages(request, env) {
  const auth = await requireUser(request, env, ['admin']);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const seriesId = String(url.searchParams.get('seriesId') || '').trim();
  if (!seriesId) {
    return errorResponse('Missing seriesId', 400);
  }

  if (!env?.TVDB_API_KEY) {
    return errorResponse('TVDB integration not configured on server', 500);
  }

  try {
    const token = await getTvdbToken(env);
    const artworksUrl = `https://api4.thetvdb.com/v4/series/${seriesId}/artworks`;
    const extendedUrl = `https://api4.thetvdb.com/v4/series/${seriesId}/extended`;

    const [artworksRes, extendedRes] = await Promise.all([
      fetch(artworksUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'User-Agent': 'CINEAST CMS/1.0'
        }
      }),
      fetch(extendedUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'User-Agent': 'CINEAST CMS/1.0'
        }
      })
    ]);

    if (!artworksRes.ok) {
      return errorResponse('Failed to fetch artworks from TVDB', artworksRes.status);
    }
    const payload = await artworksRes.json();
    const artworks = payload.data?.artworks || payload.data || [];
    
    // type 3 (fanart), type 15 (background), etc. are backdrops
    let backdrops = artworks
      .filter(art => art.type === 3 || art.type === 15 || art.type === 12)
      .map(art => art.image || art.thumbnail)
      .filter(Boolean);

    if (!backdrops.length) {
      backdrops = artworks.map(art => art.image || art.thumbnail).filter(Boolean);
    }

    let scrapbook = null;
    let overview = '';
    if (extendedRes.ok) {
      const extData = await extendedRes.json();
      const seriesDetails = extData.data || {};
      overview = seriesDetails.overview || '';
      
      const genres = (seriesDetails.genres || []).map(g => g.name).join(', ');
      const network = seriesDetails.originalNetwork?.name || seriesDetails.lastPlayed?.network || '';
      const status = seriesDetails.status?.name || '';
      const year = seriesDetails.firstAired ? seriesDetails.firstAired.slice(0, 4) : '';
      
      scrapbook = {
        genres,
        network,
        status,
        year,
        overview
      };
    }

    return okResponse({ backdrops, scrapbook, overview });
  } catch (error) {
    console.error('TVDB images fetch failed:', error);
    return errorResponse(error.message || 'TVDB images fetch failed', 500);
  }
}

async function handleTmdbSearch(request, env) {
  const auth = await requireUser(request, env, ['admin']);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const query = String(url.searchParams.get('query') || '').trim();
  if (!query) {
    return okResponse({ results: [] });
  }

  if (!env?.TMDB_API_KEY) {
    return errorResponse('TMDb integration not configured on server', 500);
  }

  const searchUrl = new URL('https://api.themoviedb.org/3/search/movie');
  searchUrl.searchParams.set('api_key', env.TMDB_API_KEY);
  searchUrl.searchParams.set('query', query);

  try {
    const response = await fetch(searchUrl.toString(), {
      headers: { 'User-Agent': 'CINEAST CMS/1.0' }
    });
    if (!response.ok) {
      return errorResponse('Failed to fetch from TMDb', response.status);
    }
    const data = await response.json();
    const results = (data.results || []).map(movie => {
      const releaseDate = movie.release_date || '';
      const year = /^\d{4}/.test(releaseDate) ? releaseDate.slice(0, 4) : '';
      return {
        id: movie.id,
        title: movie.title,
        year: year,
        poster_path: movie.poster_path ? `https://image.tmdb.org/t/p/w185${movie.poster_path}` : null,
        overview: movie.overview || ''
      };
    });
    return okResponse({ results });
  } catch (error) {
    console.error('TMDb search failed:', error);
    return errorResponse(error.message || 'TMDb search failed', 500);
  }
}

async function handleTmdbImages(request, env) {
  const auth = await requireUser(request, env, ['admin']);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const movieId = String(url.searchParams.get('movieId') || '').trim();
  if (!movieId) {
    return errorResponse('Missing movieId', 400);
  }

  if (!env?.TMDB_API_KEY) {
    return errorResponse('TMDb integration not configured on server', 500);
  }

  const imagesUrl = new URL(`https://api.themoviedb.org/3/movie/${movieId}/images`);
  imagesUrl.searchParams.set('api_key', env.TMDB_API_KEY);

  const detailsUrl = new URL(`https://api.themoviedb.org/3/movie/${movieId}`);
  detailsUrl.searchParams.set('api_key', env.TMDB_API_KEY);
  detailsUrl.searchParams.set('append_to_response', 'credits');

  try {
    const [imagesRes, detailsRes] = await Promise.all([
      fetch(imagesUrl.toString(), { headers: { 'User-Agent': 'CINEAST CMS/1.0' } }),
      fetch(detailsUrl.toString(), { headers: { 'User-Agent': 'CINEAST CMS/1.0' } })
    ]);

    if (!imagesRes.ok) {
      return errorResponse('Failed to fetch images from TMDb', imagesRes.status);
    }

    const data = await imagesRes.json();
    const backdrops = (data.backdrops || [])
      .filter((img) => img?.file_path)
      .sort((a, b) => Number(b.vote_average || 0) - Number(a.vote_average || 0))
      .map((img) => `https://image.tmdb.org/t/p/w1280${img.file_path}`);

    let director = '';
    let overview = '';
    if (detailsRes.ok) {
      const details = await detailsRes.json();
      overview = details.overview || '';
      const crew = details.credits?.crew || [];
      const dirMember = crew.find(m => m.job === 'Director');
      if (dirMember) {
        director = dirMember.name;
      }
    }

    return okResponse({ backdrops, director, overview });
  } catch (error) {
    console.error('TMDb images fetch failed:', error);
    return errorResponse(error.message || 'TMDb images fetch failed', 500);
  }
}

async function handleTmdbEnrich(request, env) {
  const auth = await requireUser(request, env, ['admin']);
  if (auth.error) return auth.error;

  if (!env?.TMDB_API_KEY) {
    return errorResponse('TMDb integration not configured on server', 500);
  }

  const body = await parseJsonBody(request);
  if (!body) return errorResponse('Invalid JSON body', 400);

  const content = String(body.content || '').trim();
  if (!content) return errorResponse('Article content is required', 400);

  if (hasMarkdownImages(content)) {
    return okResponse({
      changed: false,
      content,
      hero_image: String(body.hero_image || body.heroImage || '').trim(),
      message: 'Article already contains markdown images'
    });
  }

  const movieTitles = extractMentionedMovieTitles(content);
  if (!movieTitles.length) {
    return okResponse({
      changed: false,
      content,
      hero_image: String(body.hero_image || body.heroImage || '').trim(),
      message: 'No film mentions found. Mention a film like *Paris, Texas* (1984).'
    });
  }

  const payload = {
    title: String(body.title || '').trim(),
    content,
    meta: String(body.meta || '').trim(),
    summary: String(body.summary || '').trim(),
    heroImage: String(body.hero_image || body.heroImage || '').trim(),
    hero_image: String(body.hero_image || body.heroImage || '').trim(),
    kind: normalizeKind(body.kind || 'journal'),
    status: normalizeStatus(body.status)
  };

  const enrichedPayload = await enrichJournalPagePayload(env, payload);
  const enrichedContent = String(enrichedPayload.content || content).trim();
  const changed = enrichedContent !== content;

  return okResponse({
    changed,
    content: enrichedContent,
    hero_image: String(enrichedPayload.hero_image || enrichedPayload.heroImage || payload.hero_image || '').trim(),
    message: changed ? 'TMDb images added' : 'No TMDb stills found for the mentioned films'
  });
}

async function handleGetReactions(request, env) {
  const bindingError = ensureDb(env);
  if (bindingError) return bindingError;

  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');
  if (!slug) return errorResponse('Missing slug parameter', 400);

  try {
    const user = await getCurrentUser(request, env);
    const userId = user?.id || '';

    const likesCount = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM page_reactions WHERE page_slug = ? AND reaction_type = 'like'`
    ).bind(slug).first('count');

    const heartsCount = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM page_reactions WHERE page_slug = ? AND reaction_type = 'heart'`
    ).bind(slug).first('count');

    let userHasLiked = false;
    let userHasHearted = false;

    if (userId) {
      const liked = await env.DB.prepare(
        `SELECT 1 FROM page_reactions WHERE page_slug = ? AND user_id = ? AND reaction_type = 'like'`
      ).bind(slug, userId).first();
      userHasLiked = Boolean(liked);

      const hearted = await env.DB.prepare(
        `SELECT 1 FROM page_reactions WHERE page_slug = ? AND user_id = ? AND reaction_type = 'heart'`
      ).bind(slug, userId).first();
      userHasHearted = Boolean(hearted);
    }

    return okResponse({
      likes: likesCount || 0,
      hearts: heartsCount || 0,
      user_has_liked: userHasLiked,
      user_has_hearted: userHasHearted
    });
  } catch (err) {
    return errorResponse(err.message || 'Failed to fetch reactions', 500);
  }
}

async function handleToggleReaction(request, env) {
  const bindingError = ensureDb(env) || ensureSessions(env);
  if (bindingError) return bindingError;

  const user = await getCurrentUser(request, env);
  if (!user) return errorResponse('Unauthorized', 401);

  try {
    const body = await request.json();
    const slug = String(body?.slug || '').trim();
    const reactionType = String(body?.reaction_type || '').trim();

    if (!slug) return errorResponse('Missing slug', 400);
    if (reactionType !== 'like' && reactionType !== 'heart') {
      return errorResponse('Invalid reaction_type. Must be "like" or "heart"', 400);
    }

    const existing = await env.DB.prepare(
      `SELECT 1 FROM page_reactions WHERE page_slug = ? AND user_id = ? AND reaction_type = ?`
    ).bind(slug, user.id, reactionType).first();

    let toggled = '';
    if (existing) {
      await env.DB.prepare(
        `DELETE FROM page_reactions WHERE page_slug = ? AND user_id = ? AND reaction_type = ?`
      ).bind(slug, user.id, reactionType).run();
      toggled = 'removed';
    } else {
      await env.DB.prepare(
        `INSERT INTO page_reactions (page_slug, user_id, reaction_type) VALUES (?, ?, ?)`
      ).bind(slug, user.id, reactionType).run();
      toggled = 'added';
    }

    const likesCount = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM page_reactions WHERE page_slug = ? AND reaction_type = 'like'`
    ).bind(slug).first('count');

    const heartsCount = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM page_reactions WHERE page_slug = ? AND reaction_type = 'heart'`
    ).bind(slug).first('count');

    const userHasLiked = toggled === 'added' && reactionType === 'like' ? true 
                       : toggled === 'removed' && reactionType === 'like' ? false 
                       : Boolean(await env.DB.prepare(`SELECT 1 FROM page_reactions WHERE page_slug = ? AND user_id = ? AND reaction_type = 'like'`).bind(slug, user.id).first());

    const userHasHearted = toggled === 'added' && reactionType === 'heart' ? true 
                        : toggled === 'removed' && reactionType === 'heart' ? false 
                        : Boolean(await env.DB.prepare(`SELECT 1 FROM page_reactions WHERE page_slug = ? AND user_id = ? AND reaction_type = 'heart'`).bind(slug, user.id).first());

    return okResponse({
      success: true,
      toggled,
      likes: likesCount || 0,
      hearts: heartsCount || 0,
      user_has_liked: userHasLiked,
      user_has_hearted: userHasHearted
    });
  } catch (err) {
    return errorResponse(err.message || 'Failed to toggle reaction', 500);
  }
}

export async function handleCmsRequest(request, env) {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean);

    if (segments[0] !== 'api') {
      return applyCors(request, errorResponse('Not found', 404));
    }

    if (request.method === 'OPTIONS') {
      return corsPreflightResponse(request);
    }

    const resource = segments[1] || '';
    const subresource = segments[2] || '';

    if (resource === 'tmdb' && subresource === 'search' && request.method === 'GET') {
      return applyCors(request, await handleTmdbSearch(request, env));
    }
    if (resource === 'tmdb' && subresource === 'images' && request.method === 'GET') {
      return applyCors(request, await handleTmdbImages(request, env));
    }
    if (resource === 'tmdb' && subresource === 'enrich' && request.method === 'POST') {
      return applyCors(request, await handleTmdbEnrich(request, env));
    }

    if (resource === 'tvdb' && subresource === 'search' && request.method === 'GET') {
      return applyCors(request, await handleTvdbSearch(request, env));
    }
    if (resource === 'tvdb' && subresource === 'images' && request.method === 'GET') {
      return applyCors(request, await handleTvdbImages(request, env));
    }

    if (resource === 'health') {
      const dbHealth = await getDatabaseHealth(env);
      return applyCors(request, okResponse({
        ok: Boolean(dbHealth.db),
        service: 'cineast-cms',
        db: Boolean(dbHealth.db),
        error: dbHealth.error || null
      }));
    }

    if (resource === 'auth' && subresource === 'login' && request.method === 'POST') {
      return applyCors(request, await handleLogin(request, env));
    }
    if (resource === 'auth' && subresource === 'register' && request.method === 'POST') {
      return applyCors(request, await handleRegister(request, env));
    }
    if (resource === 'auth' && subresource === 'logout' && request.method === 'POST') {
      return applyCors(request, await handleLogout(request, env));
    }
    if (resource === 'auth' && subresource === 'me' && request.method === 'GET') {
      return applyCors(request, await handleMe(request, env));
    }
    if (resource === 'settings' && request.method === 'GET') {
      return applyCors(request, await handleGetAuthSettings(request, env));
    }
    if (resource === 'tag-overrides' && request.method === 'GET') {
      return applyCors(request, await handleGetTagOverrides(request, env));
    }
    if (resource === 'auth' && subresource === 'bootstrap' && (request.method === 'GET' || request.method === 'POST')) {
      return applyCors(request, await handleBootstrapAdmin(request, env));
    }

    if (resource === 'admin' && subresource === 'users') {
      if (segments.length === 3) {
        if (request.method === 'GET') return applyCors(request, await handleListUsers(request, env));
        if (request.method === 'POST') return applyCors(request, await handleCreateUser(request, env));
      }

      if (segments.length === 4) {
        return applyCors(request, await handleAdminUserById(request, env, segments[3]));
      }
    }

    if (resource === 'pages' && subresource === 'search' && request.method === 'GET') {
      return applyCors(request, await handlePagesSearch(request, env));
    }

    if (resource === 'search' && subresource === 'warmup' && request.method === 'GET') {
      return applyCors(request, await handleSearchWarmup(request, env));
    }
    if (resource === 'search' && request.method === 'GET') {
      return applyCors(request, await handleGlobalSearch(request, env));
    }

    if (resource === 'pages' && segments.length === 2) {
      if (request.method === 'GET') return applyCors(request, await handlePagesList(request, env));
      if (request.method === 'POST') return applyCors(request, await handlePageCreate(request, env));
    }

    if (resource === 'pages' && segments.length >= 3) {
      const key = decodeURIComponent(segments.slice(2).join('/'));
      if (request.method === 'GET') return applyCors(request, await handlePageByKey(request, env, key));
      if (request.method === 'PATCH' || request.method === 'PUT') return applyCors(request, await handlePageUpdate(request, env, key));
      if (request.method === 'DELETE') return applyCors(request, await handlePageDelete(request, env, key));
    }

    if (resource === 'reactions') {
      if (request.method === 'GET') return applyCors(request, await handleGetReactions(request, env));
      if (request.method === 'POST') return applyCors(request, await handleToggleReaction(request, env));
    }

    if (resource === 'admin' && subresource === 'settings') {
      return applyCors(request, await handleAdminSettings(request, env));
    }

    if (resource === 'admin' && subresource === 'tag-overrides') {
      return applyCors(request, await handleAdminTagOverrides(request, env));
    }

    return applyCors(request, errorResponse('Not found', 404));
  } catch (error) {
    console.error('CMS request failed', error);
    return applyCors(request, errorResponse('Internal Server Error', 500, {
      reason: error?.message || 'Unexpected server error'
    }));
  }
}
