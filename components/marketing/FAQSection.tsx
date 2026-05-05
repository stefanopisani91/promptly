"use client";

import { ChevronDown } from "lucide-react";
import type { SyntheticEvent } from "react";
import { track } from "@/lib/analytics/posthog";
import type { LandingCopy } from "@/lib/i18n/landing";

interface Props {
  copy: LandingCopy["faq"];
}

export function FAQSection({ copy }: Props) {
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
      className="overflow-hidden py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2
          id="faq-title"
          className="font-heading text-3xl font-bold leading-tight text-text-primary text-balance sm:text-4xl"
        >
          {copy.title}
        </h2>
        <p className="mt-3 text-base text-text-secondary sm:text-lg">
          {copy.sub}
        </p>
      </div>

      <ul className="mx-auto mt-10 max-w-3xl space-y-3 px-4 sm:px-6">
        {copy.items.map((item, i) => (
          <li key={i}>
            <details
              name="faq-group"
              onToggle={(e) => handleToggle(e, i)}
              className="group rounded-xl border border-border bg-surface transition-colors open:border-primary/40 open:shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-5 py-4 text-left text-base font-medium text-text-primary transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-deep sm:px-6 sm:text-lg [&::-webkit-details-marker]:hidden">
                <span>{item.q}</span>
                <ChevronDown
                  className="h-5 w-5 shrink-0 text-text-muted transition-transform duration-200 group-open:rotate-180 group-open:text-primary"
                  aria-hidden
                />
              </summary>
              <div className="px-5 pb-5 pt-0 text-sm leading-relaxed text-text-secondary sm:px-6 sm:text-base">
                <p>{item.a}</p>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
