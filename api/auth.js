const {
  configurationError,
  cookieHeader,
  createSessionToken,
  isAuthenticated,
  json,
  readJsonBody,
  safeEqual,
  sameOrigin,
} = require('../lib/curseforge-dashboard');

module.exports = async function handler(req, res) {
  const setupError = configurationError();
  if (setupError) return json(res, 503, { error: setupError });

  if (req.method === 'GET') {
    return isAuthenticated(req)
      ? json(res, 200, { authenticated: true })
      : json(res, 401, { authenticated: false, error: 'Sign in to manage CurseForge IDs.' });
  }

  if (req.method === 'POST') {
    if (!sameOrigin(req)) return json(res, 403, { error: 'Sign-in request must come from this site.' });
    let body;
    try {
      body = await readJsonBody(req);
    } catch {
      return json(res, 400, { error: 'Enter the dashboard password and try again.' });
    }
    if (
      typeof body.password !== 'string'
      || body.password.length > 256
      || !safeEqual(body.password, process.env.DASHBOARD_PASSWORD)
    ) {
      return json(res, 401, { error: 'Password is incorrect.' });
    }
    return json(
      res,
      200,
      { authenticated: true },
      { 'Set-Cookie': cookieHeader(createSessionToken(), req) },
    );
  }

  if (req.method === 'DELETE') {
    if (!sameOrigin(req)) return json(res, 403, { error: 'Sign-out request must come from this site.' });
    res.writeHead(204, {
      'Cache-Control': 'no-store',
      'Set-Cookie': cookieHeader('', req, 0),
    });
    return res.end();
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return json(res, 405, { error: 'Method not allowed.' });
};
