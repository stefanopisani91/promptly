import { Users } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import {
  getOrCreateReferralCode,
  getReferralStats,
} from "@/lib/supabase/queries";
import { getReferralUrl } from "@/lib/referral";
import { getReferralCopy } from "@/lib/i18n/referral";
import type { Lang } from "@/types";

import { ReferralShareButton } from "./ReferralShareButton";

interface Props {
  userId: string;
  fullName: string | null;
  lang: Lang;
}

const PATH_Y_THRESHOLD = 1;

export async function ReferralCard({ userId, fullName, lang }: Props) {
  const supabase = createClient();
  const copy = getReferralCopy(lang);

  let referralUrl: string;
  let stats = { count: 0, activatedAt: null as string | null };

  try {
    const [code, fetchedStats] = await Promise.all([
      getOrCreateReferralCode(supabase, userId, fullName),
      getReferralStats(supabase, userId),
    ]);
    referralUrl = getReferralUrl(code, lang);
    stats = fetchedStats;
  } catch (error) {
    console.error("[ReferralCard] failed to load referral data", error);
    return (
      <section
        aria-label={copy.card.title}
        className="rounded-2xl border border-border bg-surface p-5"
      >
        <p className="text-sm text-text-secondary">{copy.errors.generic}</p>
      </section>
    );
  }

  const pathYUnlocked = stats.count >= PATH_Y_THRESHOLD;

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
        alreadyActivated={Boolean(stats.activatedAt)}
        referrerName={fullName}
      />

      <div className="flex items-center gap-2 rounded-2xl bg-primary-light px-4 py-3 text-sm">
        <Users className="h-4 w-4 text-primary" aria-hidden />
        <p className="text-text-primary">
          <span className="font-semibold">{copy.progress.label}</span>{" "}
          <span className="font-mono">
            {stats.count}/{PATH_Y_THRESHOLD}
          </span>{" "}
          —{" "}
          <span className={pathYUnlocked ? "font-bold text-success" : "text-text-secondary"}>
            {pathYUnlocked ? copy.progress.pathYUnlocked : copy.progress.pathYHint}
          </span>
        </p>
      </div>

      <p className="text-xs text-text-muted">{copy.card.bonusReferrer}</p>
    </section>
  );
}
