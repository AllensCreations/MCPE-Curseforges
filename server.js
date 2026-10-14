const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mcaddon': 'application/octet-stream',
  '.mcpack': 'application/octet-stream',
  '.mcworld': 'application/octet-stream',
  '.zip': 'application/zip',
  '.txt': 'text/plain; charset=utf-8'
};

function renderDirectoryListing(dirPath, reqPath) {
  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  const parentPath = reqPath === '/' ? null : path.posix.dirname(reqPath);

  const fileRows = items
    .filter(item => !item.name.startsWith('.') && item.name !== 'node_modules')
    .sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    })
    .map(item => {
      const isDir = item.isDirectory();
      const href = path.posix.join(reqPath, item.name) + (isDir ? '/' : '');
      const icon = isDir ? '📁' : (item.name.endsWith('.md') ? '📝' : (item.name.endsWith('.mcaddon') || item.name.endsWith('.mcpack') || item.name.endsWith('.mcworld') ? '📦' : '📄'));
      return `
        <tr>
          <td><span class="icon">${icon}</span> <a href="${href}">${item.name}${isDir ? '/' : ''}</a></td>
          <td class="type">${isDir ? 'Directory' : path.extname(item.name) || 'File'}</td>
        </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>MCPE Curseforges - AllensCreations (${reqPath})</title>
  <style>
    :root {
      --bg: #0f1117;
      --card: #181b24;
      --border: #282d3d;
      --text: #e6edf3;
      --muted: #8b949e;
      --accent: #2ea043;
      --accent-hover: #3fb950;
      --link: #58a6ff;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
      padding: 24px;
    }
    .container { max-width: 960px; margin: 0 auto; }
    header {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 24px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    h1 { font-size: 20px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
    .badge {
      background: var(--border);
      color: var(--muted);
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 12px;
    }
    nav { display: flex; gap: 8px; flex-wrap: wrap; }
    nav a {
      background: var(--border);
      color: var(--text);
      text-decoration: none;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      transition: background 0.15s;
    }
    nav a:hover { background: var(--accent); color: #fff; }
    .breadcrumbs {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      color: var(--muted);
      font-size: 14px;
      margin-bottom: 16px;
    }
    .breadcrumbs a { color: var(--link); text-decoration: none; }
    .breadcrumbs a:hover { text-decoration: underline; }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
    }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th {
      text-align: left;
      padding: 12px 16px;
      background: rgba(255,255,255,0.02);
      border-bottom: 1px solid var(--border);
      color: var(--muted);
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td { padding: 10px 16px; border-bottom: 1px solid var(--border); }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: rgba(255,255,255,0.03); }
    td a { color: var(--text); text-decoration: none; font-weight: 500; }
    td a:hover { color: var(--link); text-decoration: underline; }
    .icon { margin-right: 8px; font-size: 15px; }
    .type { color: var(--muted); font-size: 12px; }
    footer {
      margin-top: 24px;
      text-align: center;
      color: var(--muted);
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div>
        <h1>🎮 MCPE Curseforges <span class="badge">Local Dev Server</span></h1>
        <p style="color: var(--muted); font-size: 13px; margin-top: 4px;">Created by AllensCreations</p>
      </div>
      <nav>
        <a href="/">🏠 Root</a>
        <a href="/MCPEDL/addons/">🧩 Add-ons</a>
        <a href="/MCPEDL/maps/">🗺️ Maps</a>
        <a href="/MCPEDL/script/">📜 Scripts</a>
        <a href="/builds/">📦 Builds</a>
      </nav>
    </header>

    <div class="breadcrumbs">
      Current Path: <strong>${reqPath}</strong>
    </div>

    <div class="card">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          ${parentPath !== null ? `<tr><td><span class="icon">⤴️</span> <a href="${parentPath === '.' ? '/' : parentPath + '/'}">.. (Up to Parent)</a></td><td class="type">Directory</td></tr>` : ''}
          ${fileRows}
        </tbody>
      </table>
    </div>

    <footer>
      MCPE Curseforges Local Server &bull; Running on Node.js ${process.version} &bull; All rights reserved for AllensCreations
    </footer>
  </div>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  let reqUrl = decodeURIComponent(req.url.split('?')[0]);
  let filePath = path.join(ROOT_DIR, reqUrl);

  // If root '/', serve branding.html by default
  if (reqUrl === '/' || reqUrl === '') {
    const brandingPath = path.join(ROOT_DIR, 'branding.html');
    if (fs.existsSync(brandingPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(brandingPath).pipe(res);
      return;
    }
  }

  // Security check: prevent directory traversal
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`404 Not Found: ${reqUrl}`);
      return;
    }

    if (stats.isDirectory()) {
      // If no trailing slash, redirect to trailing slash
      if (!req.url.endsWith('/') && !req.url.includes('?')) {
        res.writeHead(301, { Location: req.url + '/' });
        res.end();
        return;
      }

      // Check if directory has index.html or branding.html
      const indexCandidate = path.join(filePath, 'index.html');
      if (fs.existsSync(indexCandidate)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(indexCandidate).pipe(res);
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(renderDirectoryListing(filePath, reqUrl));
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const isAttachment = ['.mcaddon', '.mcpack', '.mcworld', '.zip'].includes(ext);

    const headers = {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache'
    };

    if (isAttachment) {
      headers['Content-Disposition'] = `attachment; filename="${path.basename(filePath)}"`;
    }

    res.writeHead(200, headers);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 MCPE Curseforges local server is running!`);
  console.log(`📡 Localhost URL: http://localhost:${PORT}`);
  console.log(`📂 Serving: ${ROOT_DIR}\n`);
  console.log(`Press Ctrl+C to stop.\n`);
});
