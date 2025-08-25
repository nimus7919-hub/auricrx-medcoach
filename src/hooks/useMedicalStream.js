import { useRef, useState } from "react";

export function useMedicalStream(serverUrl = "http://localhost:3001/api/ai/stream") {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(null);

  async function ask(messages) {
    setText("");
    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const resp = await fetch(serverUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
        signal: controller.signal,
      });

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setText(prev => prev + chunk);
      }
    } finally {
      setLoading(false);
    }
  }

  function cancel() {
    abortRef.current?.abort();
    setLoading(false);
  }

  return { text, loading, ask, cancel };
}