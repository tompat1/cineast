const SESSION_COOKIE_NAME = 'cineast_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24;
const PASSWORD_HASH_ITERATIONS = 210000;
const PASSWORD_HASH_BITS = 256;
const DEFAULT_PAGE_LIMIT = 50;
const INVITE_ONLY_SETTING_KEY = 'invite_only';

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

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
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
  const payload = {
    id: page.id,
    slug: page.slug,
    title: page.title,
    meta: page.meta || '',
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
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: PASSWORD_HASH_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    PASSWORD_HASH_BITS
  );

  return base64FromBytes(new Uint8Array(bits));
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
        meta || null,
        summary || null,
        heroImage || null,
        content,
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
        meta || null,
        summary || null,
        heroImage || null,
        content,
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

export async function handleCmsRequest(request, env) {
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

  if (resource === 'admin' && subresource === 'settings') {
    return applyCors(request, await handleAdminSettings(request, env));
  }

  return applyCors(request, errorResponse('Not found', 404));
}
