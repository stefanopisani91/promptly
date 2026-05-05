"use client";

// Presentation-only twin of ReferralCard. Same layout, but driven by props
// instead of doing its own Supabase queries — that way we can render it
// inside a client-side modal without dragging server-only code into the
// client bundle. The data is fetched once by the dashboard server component
// and handed down through the ReferralModalProvider.

import { Users } from "lucide-react";
import type { Lang } from "@/types";
import type { ReferralCopy } from "@/lib/i18n/referral";
import { ReferralShareButton } from "./ReferralShareButton";

const PATH_Y_THRESHOLD = 1;

interface Props {
  copy: ReferralCopy;
  referralUrl: string;
  count: number;
  activatedAt: string | null;
  fullName: string | null;
  lang: Lang;
}

export function ReferralCardView({
  copy,
  referralUrl,
  count,
  activatedAt,
  fullName,
  lang,
}: Props) {
  const pathYUnlocked = count >= PATH_Y_THRESHOLD;

  return (
    <section
      aria-label={copy.card.title}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5"
    >
      <header className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-bold text-text-primary">
          {copy.card.title}
        </h2>
        <p className="text-sm text-text-secondary">{copy.card.subtitle}</p>
      </header>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
          {copy.card.linkLabel}
        </span>
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface-muted px-4 py-3">
          <code className="font-mono text-sm text-text-primary">
            {referralUrl}
          </code>
        </div>
      </div>

      <ReferralShareButton
        referralUrl={referralUrl}
        lang={lang}
        alreadyActivated={Boolean(activatedAt)}
        referrerName={fullName}
      />

      <div className="flex items-center gap-2 rounded-2xl bg-primary-light px-4 py-3 text-sm">
        <Users className="h-4 w-4 text-primary" aria-hidden />
        <p className="text-text-primary">
          <span className="font-semibold">{copy.progress.label}</span>{" "}
          <span className="font-mono">
            {count}/{PATH_Y_THRESHOLD}
          </span>{" "}
          —{" "}
          <span
            className={
              pathYUnlocked ? "font-bold text-success" : "text-text-secondary"
            }
          >
            {pathYUnlocked ? copy.progress.pathYUnlocked : copy.progress.pathYHint}
          </span>
        </p>
      </div>

      <p className="text-xs text-text-muted">{copy.card.bonusReferrer}</p>
    </section>
  );
}
