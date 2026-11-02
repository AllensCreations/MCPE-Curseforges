const assert = require('node:assert/strict');
const test = require('node:test');
const authHandler = require('../api/auth');
const packsHandler = require('../api/curseforge-packs');
const {
  CATEGORIES,
  KNOWN_PACKS,
  createSessionToken,
} = require('../lib/curseforge-dashboard');

function configure(t) {
  const previous = {};
  for (const key of ['GITHUB_TOKEN', 'DASHBOARD_PASSWORD', 'SESSION_SECRET', 'VERCEL', 'NODE_ENV']) {
    previous[key] = process.env[key];
  }
  process.env.GITHUB_TOKEN = 'test-github-token';
  process.env.DASHBOARD_PASSWORD = 'a-long-dashboard-password';
  process.env.SESSION_SECRET = '0123456789abcdef0123456789abcdef';
  delete process.env.VERCEL;
  process.env.NODE_ENV = 'test';
  t.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

function response() {
  return {
    headers: {},
    writeHead(status, headers = {}) {
      this.statusCode = status;
      Object.assign(this.headers, headers);
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(body = '') {
      this.body = body;
    },
  };
}

async function invoke(handler, method, { body, cookie, origin = 'https://dashboard.test' } = {}) {
  const res = response();
  await handler({
    method,
    body,
    headers: {
      host: 'dashboard.test',
      origin,
      ...(cookie ? { cookie } : {}),
    },
  }, res);
  return res;
}

function sessionCookie() {
  return `cf_admin_session=${createSessionToken()}`;
}

test('login issues a signed session cookie and logout clears it', async t => {
  configure(t);
  const login = await invoke(authHandler, 'POST', {
    body: { password: process.env.DASHBOARD_PASSWORD },
  });
  assert.equal(login.statusCode, 200);
  assert.match(login.headers['Set-Cookie'], /HttpOnly; SameSite=Strict/);

  const cookie = login.headers['Set-Cookie'].split(';')[0];
  const session = await invoke(authHandler, 'GET', { cookie });
  assert.equal(session.statusCode, 200);

  const logout = await invoke(authHandler, 'DELETE', { cookie });
  assert.equal(logout.statusCode, 204);
  assert.match(logout.headers['Set-Cookie'], /Max-Age=0/);
});

test('wrong password and cross-origin sign-in are rejected', async t => {
  configure(t);
  const wrongPassword = await invoke(authHandler, 'POST', { body: { password: 'wrong-password' } });
  assert.equal(wrongPassword.statusCode, 401);

  const oversizedPassword = await invoke(authHandler, 'POST', { body: { password: 'x'.repeat(257) } });
  assert.equal(oversizedPassword.statusCode, 401);

  const crossOrigin = await invoke(authHandler, 'POST', {
    body: { password: process.env.DASHBOARD_PASSWORD },
    origin: 'https://attacker.test',
  });
  assert.equal(crossOrigin.statusCode, 403);
});

test('pack IDs are unavailable without an authenticated session', async t => {
  configure(t);
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error('GitHub must not be contacted before sign-in');
  };
  t.after(() => { global.fetch = originalFetch; });

  const result = await invoke(packsHandler, 'GET');
  assert.equal(result.statusCode, 401);
});

test('pack list discovers all categories and reads per-pack ID files', async t => {
  configure(t);
  const originalFetch = global.fetch;
  const visited = [];
  global.fetch = async (url, options) => {
    visited.push({ url, options });
    const category = url.match(/\/contents\/MCPEDL\/([^?]+)\?ref=main$/)?.[1];
    if (category) {
      const entries = KNOWN_PACKS
        .filter(pack => pack.id.startsWith(`MCPEDL/${category}/`))
        .map(pack => ({ name: pack.slug, type: 'dir' }));
      if (category === 'Script') entries.push({ name: 'Sample-Script', type: 'dir' });
      return { ok: true, status: 200, text: async () => JSON.stringify(entries) };
    }
    return { ok: false, status: 404, text: async () => '{"message":"Not Found"}' };
  };
  t.after(() => { global.fetch = originalFetch; });

  const result = await invoke(packsHandler, 'GET', { cookie: sessionCookie() });
  assert.equal(result.statusCode, 200);
  const payload = JSON.parse(result.body);
  assert.equal(payload.packs.length, KNOWN_PACKS.length + 1);
  assert.ok(payload.packs.every(pack => pack.projectId === ''));
  assert.deepEqual(Object.fromEntries(Object.entries(CATEGORIES).map(([key, value]) => [value.label, value.extension])), {
    Addons: '.mcaddon',
    Maps: '.mcworld',
    Script: '.mcpack',
    Minigame: '.mcaddon',
  });
  assert.ok(payload.packs.some(pack => pack.id === 'MCPEDL/Script/Sample-Script'));
  assert.equal(visited.length, KNOWN_PACKS.length + 1 + Object.keys(CATEGORIES).length);
  assert.ok(visited.every(item => item.options.headers.Authorization === 'Bearer test-github-token'));
});

test('saving an ID writes only the selected pack settings file', async t => {
  configure(t);
  const originalFetch = global.fetch;
  const requests = [];
  global.fetch = async (url, options) => {
    requests.push({ url, options });
    if (url.includes('/contents/MCPEDL/') && url.endsWith('?ref=main')) {
      const category = url.match(/\/contents\/MCPEDL\/([^?]+)\?ref=main$/)[1];
      const entries = KNOWN_PACKS
        .filter(item => item.id.startsWith(`MCPEDL/${category}/`))
        .map(item => ({ name: item.slug, type: 'dir' }));
      return { ok: true, status: 200, text: async () => JSON.stringify(entries) };
    }
    if (options.method === 'PUT') {
      return { ok: true, status: 201, text: async () => '{"content":{"sha":"saved"}}' };
    }
    return { ok: false, status: 404, text: async () => '{"message":"Not Found"}' };
  };
  t.after(() => { global.fetch = originalFetch; });

  const pack = KNOWN_PACKS[0];
  const result = await invoke(packsHandler, 'PUT', {
    cookie: sessionCookie(),
    body: { packId: pack.id, projectId: '1742470' },
  });
  assert.equal(result.statusCode, 200);
  assert.deepEqual(JSON.parse(result.body), {
    saved: true,
    packId: pack.id,
    projectId: '1742470',
  });
  assert.equal(requests.length, Object.keys(CATEGORIES).length + 2);
  const putRequest = requests.at(-1);
  assert.match(putRequest.url, new RegExp(`/builds/${pack.slug}/Curseforge_Info\\.json$`));
  const saved = JSON.parse(Buffer.from(JSON.parse(putRequest.options.body).content, 'base64').toString());
  assert.deepEqual(saved, { project_id: '1742470' });
  assert.match(JSON.parse(putRequest.options.body).message, /\[skip ci\]/);
});

test('rejects invalid IDs before contacting GitHub', async t => {
  configure(t);
  const originalFetch = global.fetch;
  let called = false;
  global.fetch = async () => {
    called = true;
    throw new Error('unexpected GitHub request');
  };
  t.after(() => { global.fetch = originalFetch; });

  const result = await invoke(packsHandler, 'PUT', {
    cookie: sessionCookie(),
    body: { packId: KNOWN_PACKS[0].id, projectId: 'not-an-id' },
  });
  assert.equal(result.statusCode, 400);
  assert.equal(called, false);
});
