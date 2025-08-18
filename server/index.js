require('dotenv').config();
const express = require('express');
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { z } = require('zod');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 4000;

// --- Security middleware ---
app.use(helmet());
app.use(express.json({ limit: "1mb" }));

// --- CORS allowlist ---
const ALLOW_ORIGINS = [
  "https://auricrx-medcoach.onrender.com", // deployed server
  "http://localhost:8081",                 // Expo dev app
  // later add your production mobile/web domain
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || ALLOW_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
}));

// --- Rate limiter for /ask ---
const askLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests/min
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: "Too many requests, please slow down." },
});
app.use("/ask", askLimiter);

// --- Your routes here ---

app.use((req, _res, next) => {
  if (req.method === "POST") {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} len=${JSON.stringify(req.body || '').length}`);
  } else {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/ask', async (req, res) => {
console.log('POST /ask', req.body);
  const schema = z.object({ message: z.string().min(1).max(5000) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: 'bad_request' });

  try {
    const completion = await client.chat.completions.create({
      model: process.env.MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful medical information assistant. Provide general information only. Do not diagnose or give personalized advice.'
        },
        { role: 'user', content: parsed.data.message }
      ],
      temperature: 0.2
    });

    const text = completion?.choices?.[0]?.message?.content?.trim() || '';
    res.json({ ok: true, reply: text });
  } catch (err) {
    console.error('OpenAI error:', err?.response?.data || err?.message);
    res.status(500).json({ ok: false, error: 'openai_error' });
  }
});

app.get('/', (_req, res) => {
  res.send('AuricRx Medcoach API is running ✅');
});

app.listen(port, () => {
  console.log(`✅ API running on http://localhost:${port}`);
});
