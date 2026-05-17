// Rate-limiter IP-based memory store. Adatto a endpoint sensibili a basso
// volume (es. /api/account/delete: 5 chiamate/ora per IP) su una singola
// istanza di Next.js. Per multi-istanza (es. Netlify functions scalate
// orizzontalmente) il counter NON è condiviso → un IP attaccante può
// fare 5*N chiamate dove N = numero istanze warm. Per ora accettabile:
// l'hard delete account è azione rara e c'è anche il typed-email
// confirmation a difesa client-side. Se si vorrà rinforzare, switch a
// Upstash Redis o Vercel KV.

import type { NextRequest } from "next/server";

type Bucket = { count: number; resetAt: number };

// Map keyed per `${endpointKey}:${ip}`. La chiave include l'endpoint
// così rate-limiter diversi (es. delete vs export) non si pestano i piedi.
const buckets = new Map<string, Bucket>();

/**
 * Estrae l'IP del client dalle header Netlify/Vercel. Cade su
 * `x-forwarded-for` (proxy chain → prendi il primo), poi `x-real-ip`,
 * poi "unknown" come ultima risorsa (utenti tutti raggruppati su un
 * bucket → safe fallback, non bypass).
 */
export function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

/**
 * Controlla il rate-limit per (endpoint, ip). Se OK, incrementa il
 * contatore e ritorna `{ ok: true, remaining }`. Se superato, ritorna
 * `{ ok: false, retryAfterSec }`.
 *
 * - `windowMs`: durata della finestra (default 1h = 3.6M ms)
 * - `max`: numero massimo di chiamate nella finestra
 */
export function checkIpRateLimit(opts: {
  ip: string;
  endpointKey: string;
  max: number;
  windowMs?: number;
}): { ok: true; remaining: number } | { ok: false; retryAfterSec: number } {
  const { ip, endpointKey, max } = opts;
  const windowMs = opts.windowMs ?? 60 * 60 * 1000;
  const key = `${endpointKey}:${ip}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1 };
  }
  if (bucket.count >= max) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  bucket.count += 1;
  return { ok: true, remaining: max - bucket.count };
}
