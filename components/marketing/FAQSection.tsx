"use client";

import { useEffect, useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import { track } from "@/lib/analytics/posthog";
import type { LandingCopy } from "@/lib/i18n/landing";

function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible] as const;
}

interface Props {
  copy: LandingCopy["faq"];
}

/**
 * FAQ in stile editoriale (rev. May 2026):
 * niente più box arrotondate, solo accordion con hairline border-bottom
 * fra domande, toggle tipografico + / − a destra (renderizzato via CSS
 * `::after` su `details/summary` — vedi `.faq-editorial-item` in globals.css).
 *
 * Per design: 6 domande max. Quelle che restano da chiedere quando uno è
 * arrivato fino qui — il resto deve essere chiaro dalle sezioni sopra.
 */
export function FAQSection({ copy }: Props) {
  const [headerRef, headerVisible] = useReveal(0.3);
  const [listRef, listVisible] = useReveal(0.08);

  const handleToggle = (
    e: SyntheticEvent<HTMLDetailsElement>,
    index: number,
  ) => {
    if (e.currentTarget.open) {
      track({ name: "landing_faq_opened", props: { question_index: index } });
    }
  };

  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      className="overflow-hidden border-t border-border py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div
          ref={headerRef as React.RefObject<HTMLDivElement>}
          className={`scroll-reveal ${headerVisible ? "in-view" : ""}`}
        >
          <h2
            id="faq-title"
            className="max-w-xl font-heading text-3xl font-bold leading-tight tracking-[-0.025em] text-text-primary text-balance sm:text-4xl lg:text-[44px]"
          >
            {copy.title}
          </h2>
          {copy.sub ? (
            <p className="mt-3 text-base text-text-secondary sm:text-lg">
              {copy.sub}
            </p>
          ) : null}
        </div>

        <div
          ref={listRef as React.RefObject<HTMLDivElement>}
          className="mt-10 sm:mt-12"
        >
          {copy.items.map((item, i) => (
            <details
              key={i}
              name="faq-editorial-group"
              open={i === 0}
              onToggle={(e) => handleToggle(e, i)}
              className={`faq-editorial-item scroll-reveal border-b border-border py-5 sm:py-6 ${listVisible ? "in-view" : ""}`}
              style={{ transitionDelay: listVisible ? `${i * 70}ms` : "0ms" }}
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-heading text-base font-semibold tracking-[-0.01em] text-text-primary outline-none transition-colors hover:text-primary-deep focus-visible:text-primary-deep sm:text-lg">
                <span>{item.q}</span>
              </summary>
              <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-text-secondary sm:text-base">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
