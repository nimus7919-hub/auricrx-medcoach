import express from "express";
import cors from "cors";
import OpenAI from "openai";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/ai/stream", async (req, res) => {
  const { messages } = req.body; // expect [{role:'system'|'user'|'assistant', content:'...'}]
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    // official OpenAI SDK (async iterable stream)
    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // choose faster model if you want low latency
      messages,
      stream: true,
      temperature: 0.2,
    });

    for await (const chunk of stream) {
      const token = chunk.choices?.[0]?.delta?.content || "";
      if (token) {
        // send tokens immediately to client
        res.write(token);
      }
    }
    res.end();
  } catch (err) {
    console.error("stream error", err);
    res.write("\n[STREAM_ERROR]\n");
    res.end();
  }
});

// Drug interaction check endpoint (non-streaming)
app.post("/api/ai/drug-interactions", async (req, res) => {
  const { messages } = req.body;
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      temperature: 0.3,
      max_tokens: 1500,
    });

    const result = completion.choices[0]?.message?.content || "";
    res.json({ result });
  } catch (err) {
    console.error("Drug interaction check error:", err);
    res.status(500).json({ error: "Failed to check drug interactions" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`AI stream server running on http://localhost:${PORT}`));