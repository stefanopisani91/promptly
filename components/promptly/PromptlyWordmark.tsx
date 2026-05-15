/**
 * Wordmark Promptly — versione tipografica del logo per superfici editoriali.
 *
 * Composizione: testo "Promptly" in Plus Jakarta Sans 700 (font-heading)
 * + dot circolare arancione 6×6px sollevato di 2px dal baseline.
 * Componente cross-app (cartella promptly/): usato dal MarketingHeader e
 * MarketingFooter sulla landing e dall'header dell'AppLayout autenticato —
 * un'unica firma di brand per tutte le surface in-app.
 *
 * NB: non sostituisce il logo SVG ufficiale (`/brand/logo-horizontal.svg`)
 * — quello resta utile per OG image, favicon, press kit, social cards.
 * Il wordmark è specifico per surface in-app dove la tipografia parla.
 */

import { cn } from "@/lib/utils";

interface Props {
  /** Dimensione del wordmark. xl = 20px (header/footer default), lg = 18px. */
  size?: "xl" | "lg";
  /** Classi extra opzionali per il wrapper. */
  className?: string;
}

export function PromptlyWordmark({ size = "xl", className }: Props) {
  return (
    <span className={cn("inline-flex items-baseline", className)}>
      <span
        className={cn(
          "font-heading font-bold leading-none tracking-[-0.02em] text-text-primary",
          size === "xl" ? "text-xl" : "text-lg",
        )}
      >
        Promptly
      </span>
      <span
        aria-hidden="true"
        className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-primary"
        style={{ transform: "translateY(-2px)" }}
      />
    </span>
  );
}
