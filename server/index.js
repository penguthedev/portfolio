import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import { portfolio } from './portfolio.js';

/**
 * Portfolio API.
 *
 * Two endpoints:
 *   GET  /api/portfolio  — the content the site renders
 *   POST /api/chat       — the assistant, backed by the Claude API
 *
 * The API key lives here and never reaches the browser. Calling Anthropic
 * directly from client-side JavaScript would expose it to anyone who opens
 * devtools, so the request is proxied through this process instead.
 */

const PORT = process.env.PORT || 8787;
const MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';
const ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));
app.use(
  cors({
    origin: (origin, cb) =>
      !origin || ORIGINS.includes(origin) ? cb(null, true) : cb(new Error('Origin not allowed')),
  })
);

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

/* ------------------------------------------------------------------ *
 * Rate limiting — a fixed window per IP, held in memory.
 * Fine for a single instance; swap for Redis if this ever runs on more.
 * ------------------------------------------------------------------ */

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 15;
const hits = new Map();

function rateLimit(req, res, next) {
  const key = req.ip;
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }
  if (entry.count >= MAX_PER_WINDOW) {
    const retryIn = Math.ceil((entry.resetAt - now) / 1000);
    res.set('Retry-After', String(retryIn));
    return res.status(429).json({ error: `Too many messages. Try again in ${retryIn}s.` });
  }
  entry.count += 1;
  next();
}

// Drop expired buckets periodically so the map cannot grow without bound.
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of hits) if (now > v.resetAt) hits.delete(k);
}, WINDOW_MS).unref();

/* ------------------------------------------------------------------ *
 * System prompt
 * ------------------------------------------------------------------ */

const SYSTEM_PROMPT = `You are Luminara, the assistant on Lin Khant's portfolio site.

Answer questions about Lin using only the facts below. If someone asks
something the facts do not cover, say you do not have that detail and point
them to Lin's email. Never invent projects, dates, employers or credentials.

Keep replies to two or three sentences. Warm, precise, no exclamation marks,
no bullet lists. Refer to Lin in the third person. Stay on the subject of
Lin's work — decline unrelated requests politely and briefly.

FACTS
${JSON.stringify(portfolio, null, 2)}`;

/* ------------------------------------------------------------------ *
 * Routes
 * ------------------------------------------------------------------ */

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, chat: Boolean(anthropic), model: anthropic ? MODEL : null });
});

app.get('/api/portfolio', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=300');
  res.json(portfolio);
});

app.post('/api/chat', rateLimit, async (req, res) => {
  if (!anthropic) {
    return res.status(503).json({ error: 'The assistant is not configured on this server.' });
  }

  const { messages } = req.body ?? {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Send a non-empty messages array.' });
  }

  // Normalise and bound the input before it reaches the model.
  const clean = messages
    .filter((m) => m && typeof m.content === 'string' && m.content.trim())
    .slice(-10)
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content.slice(0, 2000),
    }));

  if (!clean.length) return res.status(400).json({ error: 'No usable message content.' });

  try {
    const result = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: clean,
    });

    const reply = result.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    res.json({ reply: reply || 'I could not put an answer together for that one.' });
  } catch (err) {
    console.error('Chat request failed:', err);
    const status = err?.status >= 400 && err?.status < 600 ? err.status : 502;
    res.status(status).json({ error: 'The assistant is unavailable right now.' });
  }
});

app.use((_req, res) => res.status(404).json({ error: 'Not found.' }));

app.listen(PORT, () => {
  console.log(`Portfolio API listening on http://localhost:${PORT}`);
  console.log(`  chat: ${anthropic ? `enabled (${MODEL})` : 'disabled — set ANTHROPIC_API_KEY'}`);
  console.log(`  allowed origins: ${ORIGINS.join(', ')}`);
});
