"use client";

import { useCallback, useState, useTransition } from "react";
import { Copy, Share2 } from "lucide-react";

import { activateReferralLink } from "@/app/(app)/dashboard/actions";
import { track } from "@/lib/analytics/posthog";
import { getReferralCopy } from "@/lib/i18n/referral";
import { cn } from "@/lib/utils";
import type { Lang } from "@/types";

import { XpToast } from "@/components/lessons/XpToast";

interface Props {
  referralUrl: string;
  lang: Lang;
  alreadyActivated: boolean;
  referrerName: string | null;
}

const COPIED_FEEDBACK_MS = 2000;

export function ReferralShareButton({
  referralUrl,
  lang,
  alreadyActivated,
  referrerName,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [toastXp, setToastXp] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const copy = getReferralCopy(lang);

  const claimActivation = useCallback(() => {
    if (alreadyActivated) return;
    startTransition(async () => {
      const result = await activateReferralLink(lang);
      if (result.ok && result.xpAwarded > 0) {
        setToastXp(result.xpAwarded);
        track({
          name: "referral_link_activated",
          props: { first_time: result.firstActivation },
        });
      }
    });
  }, [alreadyActivated, lang]);

  const handleCopy = useCallback(async () => {
    claimActivation();
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      track({ name: "referral_link_copied", props: { source: "clipboard" } });
      window.setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    } catch {
      // Clipboard API can be blocked in non-secure contexts; fall back to
      // a manual selection. Surface nothing — the URL is visible above.
    }
  }, [claimActivation, referralUrl]);

  const handleShare = useCallback(async () => {
    claimActivation();
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: copy.share.nativeTitle,
          text: copy.share.nativeText(referrerName),
          url: referralUrl,
        });
        track({ name: "referral_link_copied", props: { source: "share_api" } });
        return;
      } catch (error) {
        // User cancelled the share sheet → no-op. Other errors fall through
        // to the clipboard fallback below.
        if ((error as { name?: string })?.name === "AbortError") return;
      }
    }
    await handleCopy();
  }, [claimActivation, copy.share, referrerName, referralUrl, handleCopy]);

  const supportsShare =
    typeof window !== "undefined" && "share" in window.navigator;

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-muted",
            copied && "border-success bg-success-light text-success",
          )}
          aria-live="polite"
        >
          <Copy className="h-4 w-4" aria-hidden />
          {copied ? copy.card.copiedFeedback : copy.card.copyBtn}
        </button>

        {supportsShare && (
          <button
            type="button"
            onClick={handleShare}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            <Share2 className="h-4 w-4" aria-hidden />
            {copy.card.shareBtn}
          </button>
        )}
      </div>

      {toastXp !== null && (
        <XpToast
          label={copy.card.activatedToast}
          onDismiss={() => setToastXp(null)}
        />
      )}
    </>
  );
}
