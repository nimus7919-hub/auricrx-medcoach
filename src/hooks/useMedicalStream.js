import uiI18n from "../i18n";
import { API_BASE } from "../config/api";
import { useEffect, useRef, useState } from "react";

const DEFAULT_OPTIONS = {};

export function useMedicalStream(serverUrl = `${API_BASE}/api/ai/stream`, options = DEFAULT_OPTIONS) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => () => {
    const controller = abortRef.current;
    abortRef.current = null;
    controller?.abort();
  }, []);

  async function ask(messages) {
    if (!serverUrl) throw new Error(uiI18n.t("ui.noStreamEndpointProvided"));
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const isCurrent = () => abortRef.current === controller && !controller.signal.aborted;
    setText("");
    setLoading(true);
    let reader;
    try {
      const response = await fetch(serverUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...options, messages }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(uiI18n.t("ui.aiRequestFailedHttpValue", { value1: response.status }));
      if (!isCurrent()) return;
      if (options.stream === false) {
        const full = await response.text();
        if (isCurrent()) setText(full);
        return isCurrent() ? full : undefined;
      }
      if (!response.body) throw new Error(uiI18n.t("ui.noResponseBody"));
      reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let full = "";
      while (isCurrent()) {
        const { value, done } = await reader.read();
        if (!isCurrent()) return;
        full += done ? decoder.decode() : decoder.decode(value, { stream: true });
        setText(full);
        if (done) return full;
      }
    } catch (error) {
      if (isCurrent() && error.name !== "AbortError") throw error;
    } finally {
      if (reader) {
        try { await reader.cancel(); } catch {}
        reader.releaseLock();
      }
      if (abortRef.current === controller) {
        abortRef.current = null;
        setLoading(false);
      }
    }
  }

  function cancel() {
    const controller = abortRef.current;
    abortRef.current = null;
    controller?.abort();
    setLoading(false);
  }

  return { text, loading, ask, cancel };
}
