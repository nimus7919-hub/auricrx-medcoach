import express from "express";
import cors from "cors";
import OpenAI from "openai";

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`AI stream server running on http://localhost:${PORT}`));