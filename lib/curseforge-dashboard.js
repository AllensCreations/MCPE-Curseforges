const crypto = require('node:crypto');
const { targets } = require('../targets.json');

const SESSION_SECONDS = 8 * 60 * 60;
const CATEGORIES = {
  Addons: { label: 'Addons', extension: '.mcaddon' },
  Maps: { label: 'Maps', extension: '.mcworld' },
  Script: { label: 'Script', extension: '.mcpack' },
  Minigame: { label: 'Minigame', extension: '.mcaddon' },
};

const KNOWN_PACKS = targets
  .filter(target => target.dir.startsWith('MCPEDL/'))
  .map(target => {
    const [, category, slug] = target.dir.split('/');
    const categoryInfo = CATEGORIES[category];
    return {
      id: target.dir,
      name: target.name,
      category: categoryInfo && categoryInfo.label,
      packageExtension: categoryInfo && categoryInfo.extension,
      slug,
    };
  })
  .filter(pack => pack.category);

function configurationError() {
  const missing = [];
  if (!process.env.GITHUB_TOKEN) missing.push('GITHUB_TOKEN');
  if (!process.env.DASHBOARD_PASSWORD || process.env.DASHBOARD_PASSWORD.length < 12) {
    missing.push('DASHBOARD_PASSWORD (at least 12 characters)');
  }
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    missing.push('SESSION_SECRET (at least 32 characters)');
  }
  return missing.length ? `Configure ${missing.join(', ')} in Vercel Environment Variables.` : null;
}

function json(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    ...headers,
  });
  res.end(JSON.stringify(body));
}

function safeEqual(left, right) {
  const leftHash = crypto.createHash('sha256').update(String(left)).digest();
  const rightHash = crypto.createHash('sha256').update(String(right)).digest();
  return crypto.timingSafeEqual(leftHash, rightHash);
}

function createSessionToken(expiresAt = Date.now() + SESSION_SECONDS * 1000) {
  const payload = Buffer.from(JSON.stringify({ expiresAt })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', process.env.SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

function cookieHeader(token, req, maxAge = SESSION_SECONDS) {
  const secure = process.env.VERCEL || process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `cf_admin_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

function isAuthenticated(req) {
  if (!process.env.SESSION_SECRET) return false;
  const cookie = (req.headers.cookie || '')
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith('cf_admin_session='));
  if (!cookie) return false;

  const token = cookie.slice('cf_admin_session='.length);
  const [payload, signature, ...extra] = token.split('.');
  if (!payload || !signature || extra.length) return false;

  const expected = crypto
    .createHmac('sha256', process.env.SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  if (!safeEqual(signature, expected)) return false;

  try {
    const { expiresAt } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return Number.isSafeInteger(expiresAt)
      && expiresAt > Date.now()
      && expiresAt <= Date.now() + (SESSION_SECONDS + 60) * 1000;
  } catch {
    return false;
  }
}

function sameOrigin(req) {
  if (!req.headers.origin || !req.headers.host) return false;
  try {
    return new URL(req.headers.origin).host.toLowerCase() === req.headers.host.toLowerCase();
  } catch {
    return false;
  }
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);

  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 4096) throw new Error('Request body is too large.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function githubPath(slug) {
  return `builds/${slug}/Curseforge_Info.json`
    .split('/')
    .map(encodeURIComponent)
    .join('/');
}

async function githubRequest(path, method = 'GET', body) {
  const response = await fetch(
    `https://api.github.com/repos/AllensCreations/MCPE-Curseforges/contents/${path}`,
    {
      method,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15000),
    },
  );
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  return { response, data };
}

async function getPackCatalog() {
  const categories = await Promise.all(Object.keys(CATEGORIES).map(async category => {
    const { response, data } = await githubRequest(`MCPEDL/${category}?ref=main`);
    if (response.status === 404) return [];
    if (!response.ok || !Array.isArray(data)) {
      throw new Error(`Could not list MCPEDL/${category} from GitHub (GitHub ${response.status}).`);
    }
    return data
      .filter(item => item.type === 'dir' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(item.name))
      .map(item => {
        const known = KNOWN_PACKS.find(pack => pack.id === `MCPEDL/${category}/${item.name}`);
        return {
          id: `MCPEDL/${category}/${item.name}`,
          name: known ? known.name : item.name.replace(/[-_]+/g, ' '),
          category: CATEGORIES[category].label,
          packageExtension: CATEGORIES[category].extension,
          slug: item.name,
        };
      });
  }));
  return categories.flat();
}

async function savedProjectId(pack) {
  const { response, data } = await githubRequest(githubPath(pack.slug));
  if (response.status === 404) return '';
  if (!response.ok || !data || typeof data.content !== 'string') {
    throw new Error(`Could not read the saved ID for ${pack.name} (GitHub ${response.status}).`);
  }
  try {
    const info = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
    if (typeof info.project_id !== 'string' || !/^\d{1,20}$/.test(info.project_id)) {
      throw new Error();
    }
    return info.project_id;
  } catch {
    throw new Error(`The saved CurseForge ID for ${pack.name} is invalid.`);
  }
}

async function saveProjectId(pack, projectId) {
  const path = githubPath(pack.slug);
  const current = await githubRequest(path);
  if (current.response.status !== 404 && !current.response.ok) {
    throw new Error(`Could not read the saved ID for ${pack.name} (GitHub ${current.response.status}).`);
  }

  let currentId = '';
  if (current.response.ok && current.data && typeof current.data.content === 'string') {
    try {
      currentId = JSON.parse(Buffer.from(current.data.content, 'base64').toString('utf8')).project_id || '';
    } catch {
      throw new Error(`The saved CurseForge ID for ${pack.name} is invalid.`);
    }
  }
  if (currentId === projectId) return;

  const content = Buffer.from(`${JSON.stringify({ project_id: projectId }, null, 2)}\n`).toString('base64');
  const { response } = await githubRequest(path, 'PUT', {
    message: `chore(curseforge): save ${pack.slug} project ID [skip ci]`,
    content,
    branch: 'main',
    ...(current.data && current.data.sha ? { sha: current.data.sha } : {}),
  });
  if (!response.ok) {
    throw new Error(
      `GitHub could not save the ID for ${pack.name} (GitHub ${response.status}). Check the token's Contents write access and main-branch rules.`,
    );
  }
}

module.exports = {
  CATEGORIES,
  KNOWN_PACKS,
  configurationError,
  cookieHeader,
  createSessionToken,
  getPackCatalog,
  githubPath,
  isAuthenticated,
  json,
  readJsonBody,
  safeEqual,
  sameOrigin,
  saveProjectId,
  savedProjectId,
};
