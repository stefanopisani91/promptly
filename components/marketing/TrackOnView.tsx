"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics/posthog";

type ViewEventName =
  | "landing_meet_spark_viewed"
  | "landing_tools_viewed"
  | "landing_closing_cta_viewed"
  | "landing_hero_viewed";

interface Props {
  event: ViewEventName;
  threshold?: number;
}

/** Sentinel invisibile che fa scattare un evento PostHog "_viewed" al primo
 *  ingresso in viewport. Esiste perché le sezioni server-rendered non hanno
 *  più un useEffect proprio per tracciare la visualizzazione. */
export function TrackOnView({ event, threshold = 0.3 }: Props) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const fired = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !fired.current) {
            fired.current = true;
            track({ name: event } as Parameters<typeof track>[0]);
            obs.disconnect();
          }
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [event, threshold]);

  return <span ref={ref} aria-hidden="true" className="block h-0 w-0" />;
}
