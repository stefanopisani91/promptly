/**
 * Rasterizes the PromptlyWordmark component into a transparent PNG used as
 * the logo header in transactional emails. Emails do not inherit the app's
 * CSS variables and Google Fonts loads inconsistently inside mail clients,
 * so we pre-render to a bitmap and ship it as a static asset.
 *
 * Output: public/brand/logo-horizontal.png (overwrites the asset shipped
 * in commit 42cf521).
 */

import { chromium } from "playwright";
import sharp from "sharp";
import { writeFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const OUTPUT_PATH = resolve(__dirname, "..", "public", "brand", "logo-horizontal.png");

// Tuned so the rendered glyph height (cap height + descender room) lands
// around ~100px tall after the 10px vertical padding. Plus Jakarta Sans
// 700 at this size produces "Promptly" + dot at roughly ~340-360px wide.
const FONT_SIZE_PX = 72;
const VERTICAL_PADDING_PX = 10;
const TEXT_COLOR = "#1F2937"; // matches the wordmark fill in assets/logo-horizontal.svg
const DOT_COLOR = "#E8703F";  // --primary

const HTML = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700&display=swap');

      html, body {
        margin: 0;
        padding: 0;
        background: transparent;
      }

      #wordmark {
        display: inline-flex;
        align-items: baseline;
        padding: ${VERTICAL_PADDING_PX}px 0;
        background: transparent;
      }

      #wordmark .text {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-weight: 700;
        font-size: ${FONT_SIZE_PX}px;
        line-height: 1;
        letter-spacing: -0.02em;
        color: ${TEXT_COLOR};
      }

      #wordmark .dot {
        display: inline-block;
        width: ${Math.round(FONT_SIZE_PX * 0.3)}px;
        height: ${Math.round(FONT_SIZE_PX * 0.3)}px;
        margin-left: ${Math.round(FONT_SIZE_PX * 0.18)}px;
        border-radius: 50%;
        background: ${DOT_COLOR};
        transform: translateY(-${Math.round(FONT_SIZE_PX * 0.1)}px);
      }
    </style>
  </head>
  <body>
    <div id="wordmark">
      <span class="text">Promptly</span>
      <span class="dot" aria-hidden="true"></span>
    </div>
  </body>
</html>`;

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    deviceScaleFactor: 1,
    viewport: { width: 800, height: 200 },
  });
  const page = await context.newPage();

  await page.setContent(HTML, { waitUntil: "load" });
  await page.evaluate(async () => {
    await (document as Document & { fonts: { ready: Promise<unknown> } }).fonts.ready;
  });

  const element = await page.locator("#wordmark");
  const buffer = await element.screenshot({
    type: "png",
    omitBackground: true,
  });

  await browser.close();

  writeFileSync(OUTPUT_PATH, buffer);

  const meta = await sharp(buffer).metadata();
  const sizeKb = statSync(OUTPUT_PATH).size / 1024;

  console.log(`PNG written → ${OUTPUT_PATH}`);
  console.log(`Dimensions  → ${meta.width} × ${meta.height} px`);
  console.log(`Channels    → ${meta.channels} (${meta.hasAlpha ? "alpha present" : "no alpha"})`);
  console.log(`File size   → ${sizeKb.toFixed(2)} KB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
