// Static host for the NPA Administration wireframes.
// No dependencies on purpose: Railway's Node builder runs `npm start` and this
// is the whole server, so there is nothing to install and nothing to go stale.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, 'public');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf'
};

const send = (res, code, type, body) => {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
  res.end(body);
};

http.createServer((req, res) => {
  const url = decodeURIComponent(String(req.url || '/').split('?')[0]);
  const file = path.join(ROOT, url === '/' ? 'index.html' : url);

  // Never serve anything outside public/.
  if (!path.resolve(file).startsWith(path.resolve(ROOT))) {
    return send(res, 403, 'text/plain; charset=utf-8', 'Forbidden');
  }

  fs.readFile(file, (err, buf) => {
    if (!err) return send(res, 200, TYPES[path.extname(file)] || 'application/octet-stream', buf);
    // The whole backend is one page, so anything unrecognised falls back to it.
    fs.readFile(path.join(ROOT, 'index.html'), (err2, home) => {
      if (err2) return send(res, 404, 'text/plain; charset=utf-8', 'Not found');
      send(res, 200, TYPES['.html'], home);
    });
  });
}).listen(PORT, () => {
  console.log('NPA Administration wireframes listening on ' + PORT);
});
