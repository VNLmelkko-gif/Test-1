const http = require('http');
const fs = require('fs');
const path = require('path');

// Đọc .env (không dùng thư viện ngoài)
try {
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  });
} catch (e) { /* không có .env */ }

const { askGemini, MODEL } = require('./chatbot');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
};

// Giới hạn tần suất đơn giản: 20 câu hỏi / phút / IP
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 60000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 20;
}

function sendJson(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

function handleChat(req, res) {
  if (!process.env.GEMINI_API_KEY) return sendJson(res, 503, { error: 'not_configured' });
  if (rateLimited(req.socket.remoteAddress)) return sendJson(res, 429, { error: 'rate_limited' });

  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > 20000) req.destroy();
  });
  req.on('end', async () => {
    try {
      const { messages } = JSON.parse(body);
      const reply = await askGemini(messages);
      sendJson(res, 200, { reply });
    } catch (err) {
      sendJson(res, err.status || 400, { error: err.message || 'error' });
    }
  });
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);

  if (urlPath === '/api/chat') {
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'method_not_allowed' });
    return handleChat(req, res);
  }

  const safePath = path.normalize(urlPath === '/' ? '/index.html' : urlPath);
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 – Sivua ei löytynyt');
    }
    const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Palvelin käynnissä: http://localhost:${PORT}`);
  console.log(process.env.GEMINI_API_KEY ? `Chatbot: ${MODEL}` : 'Chatbot: thiếu GEMINI_API_KEY trong .env');
});
