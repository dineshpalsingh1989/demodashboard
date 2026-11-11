// Local preview server for the smart city demo: node serve.js  →  http://localhost:8080
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = __dirname, PORT = process.env.PORT || 8080;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.wav': 'audio/wav', '.vtt': 'text/vtt; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};
http.createServer((req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); return res.end(); }
  let rel;
  try { rel = decodeURIComponent(req.url.split('?')[0]); }
  catch { res.writeHead(400); return res.end('Invalid path'); }
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(ROOT, rel));
  const relative = path.relative(ROOT, file);
  if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404); return res.end('Not found'); }
    const headers = { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'Accept-Ranges': 'bytes' };
    let start = 0, end = stat.size - 1, status = 200;
    if (req.headers.range && req.method === 'GET') {
      const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if (!range || !(range[1] || range[2])) { res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }); return res.end(); }   // multi-range and malformed headers
      {
        start = range[1] ? Number(range[1]) : Math.max(0, stat.size - Number(range[2]));
        end = range[1] && range[2] ? Math.min(Number(range[2]), end) : end;
        if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= stat.size) {
          res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }); return res.end();
        }
        status = 206; headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
      }
    }
    headers['Content-Length'] = stat.size ? end - start + 1 : 0;
    res.writeHead(status, headers);
    if (req.method === 'HEAD' || !stat.size) return res.end();
    const stream = fs.createReadStream(file, { start, end });
    stream.on('error', () => res.destroy());
    res.on('close', () => stream.destroy());
    stream.pipe(res);
  });
}).listen(PORT, () => console.log(`Serving ${ROOT} on http://localhost:${PORT}`));
