"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  threshold?: number;
  className?: string;
  children: React.ReactNode;
  /** Optional transition delay (ms) applied when entering view. */
  delayMs?: number;
}

/** Wrapper minimo per le sezioni server della landing che vogliono
 *  l'animazione di scroll-reveal: aggiunge la classe `.in-view` al
 *  primo ingresso in viewport (one-shot, poi disconnette). I children
 *  restano HTML server-rendered — solo questo wrapper costa JS. */
export function Reveal({ threshold = 0.15, className = "", children, delayMs }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
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

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${visible ? "in-view" : ""} ${className}`.trim()}
      style={
        delayMs != null
          ? { transitionDelay: visible ? `${delayMs}ms` : "0ms" }
          : undefined
      }
    >
      {children}
    </div>
  );
}
