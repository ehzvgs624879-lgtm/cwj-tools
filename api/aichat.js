// Vercel Serverless Function: api/aichat.js
// Simple rule-based AI chat handler for Vercel (Node.js)

const RATE_LIMIT_WINDOW = 60 * 1000; // 60s
const RATE_LIMIT_MAX = 10; // max requests per window per IP

// In-memory store: { ip: [timestamp,...] }
const requests = {};

const CHAT_RULES = {
  '你好': '你好！我是 CWJ AI 助手，有什么可以帮你的吗？',
  'hello': "Hello! I'm CWJ AI Assistant. How can I help you?",
  '你是谁': '我是 CWJ Tools 内置的 AI 聊天机器人。',
  '谢谢': '不客气！',
  '再见': '再见！祝你一天愉快！'
};

function sanitize(text, maxLength = 500) {
  if (!text || typeof text !== 'string') return null;
  let t = text.trim();
  if (t.length === 0 || t.length > maxLength) return null;
  // basic escaping for HTML to avoid reflected XSS when used in frontend
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function isRateLimited(ip) {
  const now = Date.now();
  if (!requests[ip]) requests[ip] = [];
  // keep only timestamps within window
  requests[ip] = requests[ip].filter(ts => now - ts < RATE_LIMIT_WINDOW);
  if (requests[ip].length >= RATE_LIMIT_MAX) return true;
  requests[ip].push(now);
  return false;
}

function generateReply(text) {
  const lower = text.toLowerCase();
  for (const k in CHAT_RULES) {
    if (lower.includes(k)) return CHAT_RULES[k];
  }
  const samples = [
    `你问的是「${text}」，这是个好问题！我可以帮你把问题整理成搜索关键词。`,
    `关于「${text}」，我建议查阅相关文档或给出更多细节。`,
    `我理解你在问「${text}」，可以试着把问题分成更小的步骤。`
  ];
  return samples[Math.floor(Math.random() * samples.length)];
}

module.exports = async (req, res) => {
  // Allow CORS for same-origin or any origin if needed
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: '请求太频繁，请稍后再试' });
  }

  if (req.method !== 'POST') {
    return res.json({ message: 'CWJ Tools AI chat API. Use POST with JSON {"text":"..."}.' });
  }

  let body = req.body;
  // Vercel parses JSON automatically; ensure content-type handled
  if (!body) {
    try {
      body = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => data += chunk);
        req.on('end', () => resolve(JSON.parse(data || '{}')));
        req.on('error', reject);
      });
    } catch (e) {
      return res.status(400).json({ error: '无法解析请求体' });
    }
  }

  const raw = body.text || '';
  const text = sanitize(raw);
  if (!text) {
    return res.status(400).json({ error: '请输入有效问题（1-500字符）' });
  }

  try {
    const reply = generateReply(text);
    return res.json({ reply });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: '服务器错误，请稍后重试' });
  }
};
