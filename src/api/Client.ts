const BASE = 'https://YOUR_ENDPOINT';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export class HttpError extends Error {
  constructor(public status: number, public body: any) {
    super(`HTTP ${status}`);
  }
}

export async function api<T>(
  path: string,
  { method = 'GET', body, headers, timeoutMs = 15000 }: {
    method?: HttpMethod;
    body?: any;
    headers?: Record<string, string>;
    timeoutMs?: number;
  } = {}
): Promise<T> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: controller.signal,
  }).finally(() => clearTimeout(t));

  let data: any = null;
  try { data = await res.json(); } catch {}

  if (!res.ok) throw new HttpError(res.status, data);
  return data as T;
}
