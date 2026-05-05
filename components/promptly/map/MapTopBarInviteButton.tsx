"use client";

// The "Invita" trigger that lives inside the dashboard's MapTopBar. Lives
// in its own client file so MapTopBar itself can stay a server component;
// the button just opens the shared referral modal exposed by
// <ReferralModalProvider>.

import { Gift } from "lucide-react";
import { useReferralModal } from "@/components/promptly/ReferralModalProvider";

interface Props {
  label: string;
  ariaLabel: string;
}

export function MapTopBarInviteButton({ label, ariaLabel }: Props) {
  const { open } = useReferralModal();
  return (
    <button
      type="button"
      onClick={open}
      aria-label={ariaLabel}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary transition-all hover:border-primary/40 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-deep sm:px-4 sm:text-sm"
    >
      <Gift
        aria-hidden
        className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4"
        strokeWidth={2.2}
      />
      <span>{label}</span>
    </button>
  );
}
