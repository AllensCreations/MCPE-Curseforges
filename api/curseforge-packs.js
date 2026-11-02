const {
  configurationError,
  getPackCatalog,
  isAuthenticated,
  json,
  readJsonBody,
  sameOrigin,
  saveProjectId,
  savedProjectId,
} = require('../lib/curseforge-dashboard');

module.exports = async function handler(req, res) {
  const setupError = configurationError();
  if (setupError) return json(res, 503, { error: setupError });
  if (!isAuthenticated(req)) return json(res, 401, { error: 'Sign in to manage CurseForge IDs.' });

  if (req.method === 'GET') {
    try {
      const catalog = await getPackCatalog();
      const packs = [];
      for (let index = 0; index < catalog.length; index += 5) {
        const batch = await Promise.all(catalog.slice(index, index + 5).map(async pack => ({
          ...pack,
          projectId: await savedProjectId(pack),
        })));
        packs.push(...batch);
      }
      return json(res, 200, { packs });
    } catch (error) {
      return json(res, 502, { error: error.message || 'Could not load pack IDs from GitHub.' });
    }
  }

  if (req.method === 'PUT') {
    if (!sameOrigin(req)) return json(res, 403, { error: 'Save request must come from this site.' });
    let body;
    try {
      body = await readJsonBody(req);
    } catch {
      return json(res, 400, { error: 'Invalid save request.' });
    }
    if (typeof body.projectId !== 'string' || !/^\d{1,20}$/.test(body.projectId.trim())) {
      return json(res, 400, { error: 'CurseForge project IDs must contain 1 to 20 digits.' });
    }

    try {
      const catalog = await getPackCatalog();
      const pack = catalog.find(item => item.id === body.packId);
      if (!pack) return json(res, 400, { error: 'Select a pack from the list.' });
      const projectId = body.projectId.trim();
      await saveProjectId(pack, projectId);
      return json(res, 200, { saved: true, packId: pack.id, projectId });
    } catch (error) {
      return json(res, 502, { error: error.message || 'Could not save this ID to GitHub.' });
    }
  }

  res.setHeader('Allow', 'GET, PUT');
  return json(res, 405, { error: 'Method not allowed.' });
};
