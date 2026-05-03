// In-memory sliding-window rate limiter for the public landing demo
// (`/api/landing-evaluate`). Two layers:
//   - Per-IP: caps individual abuse (5/hour, 15/day)
//   - Global: protects the OpenAI Project budget against distributed abuse
//             (60/hour, 500/day across the whole process)
//
// In-memory only — survives within a single Netlify function invocation but
// resets on cold starts. That's an acceptable tradeoff: the OpenAI Project
// budget cap is the ultimate financial backstop. For a higher-volume future
// we'd swap in Upstash Redis without changing the call sites.

const PER_IP_HOUR_LIMIT = 5;
const PER_IP_DAY_LIMIT = 15;
const GLOBAL_HOUR_LIMIT = 60;
const GLOBAL_DAY_LIMIT = 500;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

interface Bucket {
  timestamps: number[];
}

const ipBuckets = new Map<string, Bucket>();
const globalBucket: Bucket = { timestamps: [] };

function prune(bucket: Bucket, now: number): void {
  if (bucket.timestamps.length === 0) return;
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < DAY_MS);
}

function countWithin(bucket: Bucket, now: number, windowMs: number): number {
  let n = 0;
  for (const t of bucket.timestamps) {
    if (now - t < windowMs) n++;
  }
  return n;
}

export type RateLimitReason =
  | "ip_hour"
  | "ip_day"
  | "global_hour"
  | "global_day";

export type RateLimitResult =
  | { ok: true }
  | { ok: false; reason: RateLimitReason };

export function checkAndRecord(ip: string): RateLimitResult {
  const now = Date.now();

  // Global gate first — cheaper than touching per-IP storage.
  prune(globalBucket, now);
  const globalHour = countWithin(globalBucket, now, HOUR_MS);
  if (globalHour >= GLOBAL_HOUR_LIMIT) {
    return { ok: false, reason: "global_hour" };
  }
  if (globalBucket.timestamps.length >= GLOBAL_DAY_LIMIT) {
    return { ok: false, reason: "global_day" };
  }

  // Per-IP gate.
  let bucket = ipBuckets.get(ip);
  if (!bucket) {
    bucket = { timestamps: [] };
    ipBuckets.set(ip, bucket);
  }
  prune(bucket, now);
  const ipHour = countWithin(bucket, now, HOUR_MS);
  if (ipHour >= PER_IP_HOUR_LIMIT) {
    return { ok: false, reason: "ip_hour" };
  }
  if (bucket.timestamps.length >= PER_IP_DAY_LIMIT) {
    return { ok: false, reason: "ip_day" };
  }

  // Record only after both gates pass.
  bucket.timestamps.push(now);
  globalBucket.timestamps.push(now);

  // Opportunistic cleanup of empty IP buckets — bounded memory under churn.
  if (Math.random() < 0.01) {
    for (const [k, v] of ipBuckets.entries()) {
      if (v.timestamps.length === 0) ipBuckets.delete(k);
    }
  }

  return { ok: true };
}

/** Best-effort client IP extraction. Order matters: prefer Netlify's
 * dedicated header, then standard x-forwarded-for, then fallback. */
export function extractClientIp(headers: Headers): string {
  const netlifyIp = headers.get("x-nf-client-connection-ip");
  if (netlifyIp) return netlifyIp.trim();

  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}

/** Test-only hook: clears all internal state. Not exported via index — call
 * directly from tests if/when added. */
export function __resetRateLimitForTests(): void {
  ipBuckets.clear();
  globalBucket.timestamps = [];
}
