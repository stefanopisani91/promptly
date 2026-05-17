// =============================================================================
// PostHog reverse-proxy full-trace diagnostic
// =============================================================================
//
// A COSA SERVE
// Stampa tutto quello che succede quando un visitatore reale apre la landing
// dal punto di vista di PostHog: richieste verso /ingest/* (con status,
// content-length, postData se piccolo), eventuali richieste *dirette* a
// posthog.com (devono essere zero), CSP violations, console errors,
// pageerror, lo stato di window.posthog (se esposto), il dump localStorage
// delle chiavi ph_*/posthog* e l'elenco dei cookie con domain associato.
// In più clicca "Accetta tutto" sul banner iubenda navigando i shadow
// DOM annidati dei Web Components, e prova a forzare un evento esplicito
// + flush via pagehide/visibilitychange/goto('about:blank').
//
// QUANDO CONVIENE USARLO
// 1. PostHog dashboard non mostra eventi che ti aspettavi (Activity → Live
//    vuoto, Web Analytics "Waiting for events…"). Lo script ti dice se
//    il SDK riesce a caricarsi attraverso il proxy.
// 2. Hai cambiato qualcosa in lib/analytics/posthog.ts o nei rewrites di
//    next.config.mjs e vuoi una conferma deterministica del network flow.
// 3. Sospetti un problema di consent gating iubenda: lo script clicca il
//    pulsante reale del banner e poi controlla che il cookie _iub_cs-* e
//    quello PostHog ph_* siano stati scritti.
// 4. Sospetti che qualcosa bypassi il proxy e parli direttamente a
//    eu.i.posthog.com (es. dopo un upgrade posthog-js): la sezione
//    "DIRECT posthog.com reqs" deve restare a 0.
//
// LIMITAZIONE NOTA — il vero flow eventi NON è verificabile da qui
// posthog-js v1.260+ contiene una user-agent blocklist che include
// "HeadlessChrome". Playwright gira con quello user agent (anche se gli
// passi un UA custom, navigator.webdriver e altri marker rivelano la
// natura headless) → il SDK ti considera bot e *scarta gli eventi prima
// di mandare la POST*. In output vedrai sempre solo i 2 GET di bootstrap
// (array/<token>/config.js + static/surveys.js), mai i POST verso /e/ o
// /i/v0/e/. Per verificare il flow eventi reale: Chrome/Safari in
// modalità incognito, DevTools → Network filtro "ingest", e guarda le
// righe POST a mano. Lo script serve a tutto il resto.
//
// COSA CERCARE NEL REPORT
// - Ingest reqs ≥ 2 (config.js + surveys.js) → SDK caricato e inizializzato
// - Direct posthog.com reqs = 0 → proxy correttamente intercetta
// - "request failed" vuoto → niente blocchi browser
// - console errors / page errors vuoti → niente exception nel boot del SDK
// - Cookie ph_phc_*_posthog con domain = .learnpromptly.app → consent +
//   persistence ok (NON deve essere su .posthog.com, sarebbe un bug proxy)
// - localStorage ph_phc_*_posthog deve avere distinct_id e
//   $initialization_time popolati → init() ha lavorato
//
// COME LANCIARLO
//   node scripts/test-posthog-full-trace.mjs
// Per testare un URL diverso (es. preview Netlify, dev locale) cambia la
// costante SITE qua sotto.
//
// STORIA
// Nato il 17/05/2026 durante la diagnosi del bug "PostHog dashboard vuoto
// dopo il deploy del reverse-proxy". Ha portato all'identificazione di
// 3 cause concatenate fixate nei commit 2e05961 → 4ed7d82 → 057f63f.
// =============================================================================

import { chromium } from "playwright";

const SITE = "https://learnpromptly.app/it";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function isIngest(url) {
  return /learnpromptly\.app\/ingest\//.test(url);
}
function isDirectPosthog(url) {
  return /(^https?:\/\/)([a-z0-9-]+\.)?(i\.posthog\.com|posthog\.com)\//.test(url);
}
function relevant(url) {
  return isIngest(url) || isDirectPosthog(url);
}

async function clickIubendaAccept(page) {
  // Walk all shadow roots, find a clickable element whose text contains
  // "Accetta tutto" (Italian primary CTA). Fall back to known classes.
  return await page.evaluate(() => {
    const visited = new WeakSet();
    function collectRoots(root, acc) {
      if (!root || visited.has(root)) return;
      visited.add(root);
      acc.push(root);
      const hosts = root.querySelectorAll("*");
      for (let i = 0; i < hosts.length; i++) {
        const sr = hosts[i].shadowRoot;
        if (sr) collectRoots(sr, acc);
      }
    }
    const roots = [];
    collectRoots(document, roots);

    const candidates = [];
    for (const r of roots) {
      const buttons = r.querySelectorAll("button, [role='button'], a.iubenda-cs-accept-btn");
      buttons.forEach((b) => {
        const text = (b.textContent || "").trim();
        candidates.push({
          text,
          cls: b.className || "",
          id: b.id || "",
          tag: b.tagName.toLowerCase(),
          el: b,
        });
      });
    }

    // First try Italian text "Accetta tutto"
    let match =
      candidates.find((c) => /accetta tutto/i.test(c.text)) ||
      candidates.find((c) => /accetta/i.test(c.text) && !/personali/i.test(c.text)) ||
      candidates.find((c) => /iubenda-cs-accept-btn/i.test(c.cls)) ||
      candidates.find((c) => /accept all/i.test(c.text));

    const summary = candidates.slice(0, 30).map((c) => ({
      tag: c.tag,
      text: c.text.slice(0, 60),
      cls: c.cls.slice(0, 60),
      id: c.id,
    }));

    if (!match) return { ok: false, summary, totalCandidates: candidates.length };
    match.el.click();
    return {
      ok: true,
      clicked: { tag: match.tag, text: match.text.slice(0, 60), cls: match.cls.slice(0, 60) },
      totalCandidates: candidates.length,
    };
  });
}

async function main() {
  // headless: false would need a display — fall back to "new" headless mode
  // (chromium-headless-shell) with realistic UA + viewport. This gives us
  // a real browser engine identical to headed mode, just without an X11
  // window. If you have a display, swap to headless: false.
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    userAgent: UA,
    viewport: { width: 1440, height: 900 },
    locale: "it-IT",
    timezoneId: "Europe/Rome",
  });
  const page = await context.newPage();

  const requests = []; // every relevant request
  const failed = []; // request failures
  const consoleMsgs = []; // every console message
  const pageErrors = [];
  const inFlight = new Map();

  page.on("request", (req) => {
    const url = req.url();
    if (!relevant(url) && !/posthog/i.test(url)) return;
    const u = new URL(url);
    const pd = req.postData();
    const entry = {
      method: req.method(),
      url,
      path: u.pathname,
      host: u.host,
      status: null,
      reqHeaders: req.headers(),
      postDataSample: pd && pd.length <= 2048 ? pd.slice(0, 400) : pd ? `(${pd.length} bytes)` : null,
      contentLength: null,
      failure: null,
    };
    requests.push(entry);
    inFlight.set(req, entry);
  });
  page.on("response", async (res) => {
    const entry = inFlight.get(res.request());
    if (!entry) return;
    entry.status = res.status();
    const cl = res.headers()["content-length"];
    entry.contentLength = cl ?? null;
  });
  page.on("requestfailed", (req) => {
    const entry = inFlight.get(req);
    const errText = req.failure()?.errorText ?? "unknown";
    if (entry) entry.failure = errText;
    if (relevant(req.url()) || /posthog/i.test(req.url())) {
      failed.push({ url: req.url(), method: req.method(), error: errText });
    }
  });
  page.on("console", (msg) => {
    consoleMsgs.push({ level: msg.type(), text: msg.text() });
  });
  page.on("pageerror", (err) => pageErrors.push(err.message + (err.stack ? "\n" + err.stack.slice(0, 400) : "")));

  console.log("→ goto", SITE);
  await page.goto(SITE, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(4000); // banner attach

  console.log("→ click iubenda accept");
  const clickRes = await clickIubendaAccept(page);
  console.log("   result:", JSON.stringify(clickRes).slice(0, 800));

  // Wait LONG enough for: (1) iubenda cookie write, (2) provider polling
  // tick (1s) to fire initPostHog + setReady(true), (3) landing_viewed
  // useEffect to call track(), (4) PostHog batch flush interval to fire.
  console.log("→ wait 20s for SDK init + batch flush");
  await page.waitForTimeout(20000);

  console.log("→ probe window.posthog state + queued events");
  const queuedState = await page.evaluate(() => {
    const all = {};
    for (const k of Object.keys(localStorage)) {
      if (/posthog|^ph_/i.test(k)) {
        const v = localStorage.getItem(k);
        all[k] = v && v.length > 600 ? v.slice(0, 600) + "..." : v;
      }
    }
    return all;
  });
  console.log("   localStorage dump:", JSON.stringify(queuedState, null, 2));

  const phState = await page.evaluate(() => {
    const ph = window.posthog;
    const out = { hasGlobal: typeof ph !== "undefined" && ph !== null };
    if (!out.hasGlobal) {
      out.windowKeysWithPh = Object.keys(window).filter((k) => /posthog/i.test(k));
      return out;
    }
    try {
      out.apiHost = ph.config?.api_host;
      out.uiHost = ph.config?.ui_host;
      out.token = ph.config?.token;
      out.loaded = ph.__loaded;
      out.persistenceProps = ph.persistence?.props
        ? {
            distinct_id: ph.persistence.props.distinct_id,
            $device_id: ph.persistence.props.$device_id,
            $user_state: ph.persistence.props.$user_state,
            $sesid: !!ph.persistence.props.$sesid,
            keys: Object.keys(ph.persistence.props).slice(0, 20),
          }
        : null;
      out.hasOptedIn =
        typeof ph.has_opted_in_capturing === "function" ? ph.has_opted_in_capturing() : "n/a";
      out.hasOptedOut =
        typeof ph.has_opted_out_capturing === "function" ? ph.has_opted_out_capturing() : "n/a";
      out.flushFn = typeof ph.flush === "function";
      out.captureFn = typeof ph.capture === "function";
      out.queueLen = ph._request_queue?.length ?? null;
      out.retryQueueLen = ph._retryQueue?.length ?? ph._retry_queue?.length ?? null;
    } catch (e) {
      out.probeError = e.message;
    }
    const phKeys = Object.keys(localStorage).filter((k) => /^ph_|posthog/i.test(k));
    out.localStorageKeys = phKeys;
    return out;
  });
  console.log("   posthog:", JSON.stringify(phState, null, 2));

  console.log("→ explicit capture('proxy_smoke_test')");
  const captureRes = await page.evaluate(() => {
    if (typeof window.posthog === "undefined" || !window.posthog) return { ok: false, reason: "no window.posthog" };
    try {
      window.posthog.capture("proxy_smoke_test", {
        timestamp: new Date().toISOString(),
        source: "playwright_full_trace",
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: e.message };
    }
  });
  console.log("   ", JSON.stringify(captureRes));
  await page.waitForTimeout(3000);

  console.log("→ posthog.flush()");
  await page.evaluate(() => {
    try {
      window.posthog?.flush?.();
    } catch (e) {}
  });
  await page.waitForTimeout(5000);

  console.log("→ dispatch pagehide / visibilitychange");
  await page.evaluate(() => {
    document.dispatchEvent(new Event("visibilitychange"));
    window.dispatchEvent(new Event("pagehide"));
  });
  await page.waitForTimeout(3000);

  console.log("→ goto about:blank to force flush");
  await page.goto("about:blank");
  await page.waitForTimeout(3000);

  // Cookies set
  const cookies = await context.cookies();
  const phCookies = cookies.filter((c) => /^ph_|posthog/i.test(c.name));

  // ---- REPORT ----
  console.log("\n\n========== REPORT ==========\n");

  const ingest = requests.filter((r) => isIngest(r.url));
  const direct = requests.filter((r) => isDirectPosthog(r.url));

  console.log(`Ingest reqs: ${ingest.length} | Direct posthog: ${direct.length} | Failed: ${failed.length}`);

  console.log("\n--- /ingest/* requests ---");
  for (const r of ingest) {
    console.log(
      `${r.method.padEnd(4)} ${r.path.padEnd(60)} → ${String(r.status ?? "—").padEnd(4)} CL=${r.contentLength ?? "—"}${r.failure ? " FAIL:" + r.failure : ""}`,
    );
    if (r.postDataSample) console.log(`     postData[0..400]: ${r.postDataSample}`);
  }

  console.log("\n--- DIRECT posthog.com reqs (should be 0) ---");
  for (const r of direct) {
    console.log(`${r.method} ${r.url.slice(0, 160)} → ${r.status}`);
  }

  console.log("\n--- request failed ---");
  for (const f of failed) console.log(`  ${f.method} ${f.url.slice(0, 160)} — ${f.error}`);

  console.log("\n--- console errors / warnings ---");
  const interesting = consoleMsgs.filter(
    (m) => m.level === "error" || m.level === "warning" || /posthog|csp|cors/i.test(m.text),
  );
  for (const m of interesting.slice(0, 30)) console.log(`  [${m.level}] ${m.text.slice(0, 240)}`);

  console.log("\n--- page errors ---");
  for (const e of pageErrors) console.log(`  ${e.slice(0, 400)}`);

  console.log("\n--- cookies ph_* / posthog* ---");
  for (const c of phCookies) {
    console.log(`  ${c.name}  domain=${c.domain}  path=${c.path}  httpOnly=${c.httpOnly}  secure=${c.secure}`);
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
