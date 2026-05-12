"use client";

import Image from "next/image";

interface Props {
  /** Alt text per ognuna delle 7 schermate del carosello. */
  slides: string[];
  /** Aria-label esterno per la cornice (descrive il device + carosello). */
  ariaLabel: string;
  /** Sorgenti delle immagini. Default: 7 file in /brand/mobile/ come WebP.
   * Override solo per test o varianti. */
  images?: string[];
}

const DEFAULT_IMAGES = [
  "/brand/mobile/screen-1.webp",
  "/brand/mobile/screen-2.webp",
  "/brand/mobile/screen-3.webp",
  "/brand/mobile/screen-4.webp",
  "/brand/mobile/screen-5.webp",
  "/brand/mobile/screen-6.webp",
  "/brand/mobile/screen-7.webp",
];

/**
 * Cornice iPhone 15 con prospettiva 3D e carosello orizzontale di 7
 * schermate Promptly. Tutto in CSS puro (vedi .iphone-* in app/globals.css).
 *
 * - Carosello: loop di 28s, ogni schermata visibile ~2.7s
 * - Hover sul telefono mette in pausa l'animazione
 * - prefers-reduced-motion: animazione disattivata, prima schermata statica
 *
 * Per cambiare angolazione: override delle CSS vars
 *   `--iphone-rotate-y` / `--iphone-rotate-x` / `--iphone-rotate-z`
 * via classe wrapper o style inline sul .iphone-frame.
 *
 * Le 7 immagini WebP devono esistere in `public/brand/mobile/` con i nomi
 * dichiarati in DEFAULT_IMAGES. Vengono generate dallo script di
 * ottimizzazione PNG → WebP.
 */
export function IphoneCarousel({
  slides,
  ariaLabel,
  images = DEFAULT_IMAGES,
}: Props) {
  // Per il loop senza scatti il carosello contiene 8 slot:
  // le 7 immagini reali + un duplicato della prima a fine ciclo.
  const slidesWithLoop = [...images, images[0]];
  const altsWithLoop = [...slides, ""];

  return (
    <div className="iphone-wrap">
      <div
        className="iphone-frame"
        role="img"
        aria-label={ariaLabel}
      >
        <span className="iphone-btn-side iphone-btn-action" aria-hidden="true" />
        <span className="iphone-btn-side iphone-btn-vol-up" aria-hidden="true" />
        <span className="iphone-btn-side iphone-btn-vol-down" aria-hidden="true" />
        <span className="iphone-btn-side iphone-btn-power" aria-hidden="true" />

        <div className="iphone-screen">
          <div className="iphone-carousel">
            {slidesWithLoop.map((src, idx) => (
              <Image
                key={`${src}-${idx}`}
                src={src}
                alt={altsWithLoop[idx] ?? ""}
                // iPhone 15 logical resolution è 393×852 pt (3x = 1179×2556).
                // Per next/image dichiariamo le dimensioni nominali e lasciamo
                // al CSS object-fit:cover il fit nello slot di carosello.
                width={393}
                height={852}
                priority={idx === 0}
                sizes="(min-width: 1280px) 320px, 280px"
              />
            ))}
          </div>
          <span className="iphone-island" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
