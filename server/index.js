require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { z } = require('zod');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/ask', async (req, res) => {
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

app.listen(port, () => {
  console.log(`✅ API running on http://localhost:${port}`);
});
