// Ad-hoc calibration script for the deep_motivation compressor.
// Runs the Haiku call against a fixed set of raw motivations (IT + EN,
// across the emotional spectrum) and prints raw → compressed pairs so
// we can eyeball whether the emotional core survives.
//
// Usage:  npx tsx scripts/calibrate-motivation-compress.ts
// Env:    expects ANTHROPIC_API_KEY in .env.local (loaded via Next).

// Tiny .env.local loader — no external dependency. Reads `KEY=value`
// lines and only sets keys that aren't already in the environment.
import { readFileSync } from "node:fs";
import path from "node:path";
import { compressMotivation } from "../lib/onboarding/compress-motivation";

try {
  const envFile = readFileSync(
    path.join(process.cwd(), ".env.local"),
    "utf8",
  );
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key]) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
} catch {
  /* .env.local missing — fall through, ANTHROPIC_API_KEY may be set globally */
}

interface Sample {
  label: string;
  lang: "it" | "en";
  raw: string;
}

const SAMPLES: Sample[] = [
  {
    label: "IT — frustrazione + sogno (lungo)",
    lang: "it",
    raw: "Ho un'idea da 3 anni che non riesco a costruire, ogni volta che ci provo mi blocco perché non so programmare e i corsi che ho fatto sono troppo astratti, voglio finalmente farcela",
  },
  {
    label: "IT — pragmatica/lavoro (medio)",
    lang: "it",
    raw: "Lavoro come marketing manager, vorrei imparare a costruire piccoli tool per il mio team senza dipendere ogni volta dagli sviluppatori che hanno mille altre priorità",
  },
  {
    label: "IT — paura + curiosità (breve)",
    lang: "it",
    raw: "Ho paura di rimanere indietro nel mio lavoro perché tutti parlano di AI ma io non capisco bene come usarla, voglio capirla davvero invece di fingere",
  },
  {
    label: "EN — urgenza/economica",
    lang: "en",
    raw: "I'm running a small e-commerce alone and I burn money on freelancers for every tiny tweak — I want to stop being held hostage by people I can't even check on",
  },
  {
    label: "EN — riscatto/personale",
    lang: "en",
    raw: "I've spent 10 years in a job I don't like, I want to finally build something that's mine, even if it's small, even if it fails — I just need to prove to myself that I can",
  },
];

async function main() {
  for (const s of SAMPLES) {
    console.log("─".repeat(72));
    console.log(`▸ ${s.label}`);
    console.log(`  raw (${s.raw.length} chars):`);
    console.log(`    ${s.raw}`);
    const result = await compressMotivation({ raw: s.raw, lang: s.lang });
    if (!result.ok) {
      console.log(`  ✗ ERROR: ${JSON.stringify(result.error)}`);
      continue;
    }
    console.log(`  compressed (${result.compressed.length} chars):`);
    console.log(`    ${result.compressed}`);
  }
  console.log("─".repeat(72));
}

main().catch((err) => {
  console.error("calibration failed:", err);
  process.exit(1);
});
