"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { track } from "@/lib/analytics/posthog";
import type { LandingCopy } from "@/lib/i18n/landing";

interface Props {
  copy: LandingCopy["tools"];
}

type ToolSlug = LandingCopy["tools"]["cards"][number]["slug"];

function useReveal(threshold = 0.1) {
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

/** Renderizza markdown bold `**testo**` come <strong> nel sub. */
function renderBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-text-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/** Icone stilizzate astratte per ogni IDE. Non sono logo reali — sono
 *  rappresentazioni geometriche da sostituire con i logo ufficiali
 *  (via Simple Icons o asset proprio) quando si vorrà. */
function ToolIcon({ slug }: { slug: ToolSlug }) {
  const common = {
    viewBox: "0 0 56 56",
    fill: "none" as const,
    className: "h-14 w-14",
  };
  switch (slug) {
    case "cursor":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M14 8 L28 28 L14 48 Z" fill="var(--text-primary)" />
          <path d="M42 8 L28 28 L42 48 Z" fill="var(--primary)" opacity="0.85" />
          <circle cx="28" cy="28" r="3" fill="#fff" stroke="var(--text-primary)" strokeWidth="1.5" />
        </svg>
      );
    case "claude-code":
      return (
        <svg {...common} aria-hidden="true">
          <rect x="10" y="14" width="36" height="6" rx="3" fill="var(--primary)" />
          <rect x="10" y="25" width="28" height="6" rx="3" fill="var(--text-primary)" />
          <rect x="10" y="36" width="20" height="6" rx="3" fill="var(--text-muted)" />
        </svg>
      );
    case "windsurf":
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M8 22 Q20 12 32 22 T 50 22"
            stroke="var(--text-primary)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M8 32 Q20 22 32 32 T 50 32"
            stroke="var(--primary)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M8 42 Q20 32 32 42 T 50 42"
            stroke="var(--text-muted)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );
    case "copilot":
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M14 36 Q14 18 28 18 Q42 18 42 36 L42 42 Q42 46 38 46 L18 46 Q14 46 14 42 Z"
            fill="var(--text-primary)"
          />
          <circle cx="22" cy="32" r="3" fill="#fff" />
          <circle cx="34" cy="32" r="3" fill="#fff" />
          <path
            d="M22 14 L22 10 M34 14 L34 10"
            stroke="var(--primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "bolt":
      return (
        <svg {...common} aria-hidden="true">
          <path
            d="M30 8 L16 30 L26 30 L22 48 L40 24 L30 24 Z"
            fill="var(--primary)"
            stroke="var(--text-primary)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "v0":
      return (
        <svg {...common} aria-hidden="true">
          <text
            x="28"
            y="42"
            textAnchor="middle"
            fontFamily="ui-monospace, monospace"
            fontSize="36"
            fontWeight="700"
            fill="var(--text-primary)"
          >
            v0
          </text>
          <circle cx="44" cy="14" r="4" fill="var(--primary)" />
        </svg>
      );
  }
}

export function ToolsSection({ copy }: Props) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const viewedRef = useRef(false);
  const [gridRef, gridVisible] = useReveal(0.1);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || viewedRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !viewedRef.current) {
            viewedRef.current = true;
            track({ name: "landing_tools_viewed" });
            obs.disconnect();
          }
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);

  const onCardClick = (slug: ToolSlug) => {
    track({ name: "landing_tool_clicked", props: { tool_slug: slug } });
  };

  return (
    <section
      ref={sectionRef}
      id="tools"
      aria-labelledby="tools-title"
      className="overflow-hidden border-t border-border py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.06em] text-text-muted">
            {copy.kicker}
          </p>
          <h2
            id="tools-title"
            className="mt-3 font-heading text-3xl font-bold leading-tight tracking-[-0.025em] text-text-primary text-balance sm:text-4xl lg:text-5xl"
          >
            {copy.title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-text-secondary sm:text-lg">
            {renderBold(copy.sub)}
          </p>
        </div>

        <ul
          ref={gridRef as React.RefObject<HTMLUListElement>}
          className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 lg:mt-14 lg:grid-cols-3 lg:gap-6"
        >
          {copy.cards.map((card, i) => (
            <li
              key={card.slug}
              className={`scroll-reveal ${gridVisible ? "in-view" : ""}`}
              style={{ transitionDelay: gridVisible ? `${i * 80}ms` : "0ms" }}
            >
              {/* Niente pagina /lezioni/[slug] ancora → è un <button>, non un
                  <a href="#">. Quando le lezioni per-strumento esisteranno,
                  diventerà un <Link href={`/${lang}/lezioni/${slug}`}>. */}
              <button
                type="button"
                aria-label={card.ariaLabel}
                onClick={() => onCardClick(card.slug)}
                className="tool-card group flex h-full min-h-[260px] w-full flex-col rounded-2xl border border-border bg-surface p-6 text-left text-text-primary transition-all hover:-translate-y-1 hover:border-primary hover:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_20px_40px_-10px_rgba(232,112,63,0.15)]"
              >
                <div className="my-2 mb-4 flex h-24 items-center justify-center rounded-xl bg-surface-muted transition-colors group-hover:bg-primary-light">
                  <ToolIcon slug={card.slug} />
                </div>

                <h3 className="font-heading text-xl font-bold leading-tight tracking-[-0.02em] text-text-primary">
                  {card.name}
                </h3>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-text-secondary">
                  {card.desc}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <span className="font-mono text-[11px] uppercase tracking-[0.04em] text-text-muted">
                    {card.badge}
                  </span>
                  <span
                    aria-hidden="true"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-text-primary text-white opacity-50 transition-all group-hover:translate-x-1 group-hover:opacity-100"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
