// src/api/api.medical-ai.ts

const API_URL = "https://api.openai.com/v1/chat/completions";

export async function askMedicalAI(userMessage: string): Promise<string> {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // good for mobile, cheaper & fast
        messages: [
          {
            role: "system",
            content:
              "You are a helpful medical assistant, but not a doctor. Provide information only.",
          },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "No response";
  } catch (error) {
    console.error("Error calling Medical AI:", error);
    return "Sorry, I couldn’t get an answer. Please try again.";
  }
}

