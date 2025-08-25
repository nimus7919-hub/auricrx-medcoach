// src/api/api.medical-ai.js
import { API_BASE } from "../config/api";

export async function askMedicalAI(message) {
  // Optional debug to verify the URL used by the app
  console.log("API_BASE:", API_BASE);

  const res = await fetch(`${API_BASE}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${text || ""}`.trim());
  }

  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "API error");
  return data.reply;
}
