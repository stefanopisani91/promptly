"use client";

// Provides a single, app-shell-level referral modal that any descendant
// component can open via the `useReferralModal` hook. Centralising the modal
// means the SparkCompanionCard and the MapTopBar invite-button (the two
// entry points decided in the design pass) share the exact same surface,
// without re-mounting it twice in the DOM.
//
// The modal itself is `<dialog>` for native esc-to-close + scroll-lock.
// The trapped focus + return-to-trigger behaviour is the browser's job.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import type { Lang } from "@/types";
import { getReferralCopy } from "@/lib/i18n/referral";
import { ReferralCardView } from "./ReferralCardView";

// Only serializable fields cross the server→client boundary. The copy
// object lives entirely on the client (loaded from `getReferralCopy(lang)`
// inside this provider) because it contains a function, `share.nativeText`,
// which Next.js refuses to pass through to a client component.
interface ReferralData {
  referralUrl: string;
  count: number;
  activatedAt: string | null;
  fullName: string | null;
  lang: Lang;
}

interface Ctx {
  open: () => void;
  close: () => void;
  isOpen: boolean;
}

const ReferralModalContext = createContext<Ctx | null>(null);

export function useReferralModal(): Ctx {
  const ctx = useContext(ReferralModalContext);
  if (!ctx) {
    throw new Error(
      "useReferralModal must be used inside <ReferralModalProvider>",
    );
  }
  return ctx;
}

interface Props {
  data: ReferralData;
  children: ReactNode;
}

export function ReferralModalProvider({ data, children }: Props) {
  const copy = getReferralCopy(data.lang);
  const closeLabel = copy.trigger.closeLabel;
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  // Sync React state with the native <dialog> element.
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (isOpen && !dlg.open) {
      dlg.showModal();
    } else if (!isOpen && dlg.open) {
      dlg.close();
    }
  }, [isOpen]);

  // Listen for the native close (Esc key, form submit, etc).
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const onClose = () => setIsOpen(false);
    dlg.addEventListener("close", onClose);
    return () => dlg.removeEventListener("close", onClose);
  }, []);

  const value = useMemo<Ctx>(() => ({ open, close, isOpen }), [open, close, isOpen]);

  return (
    <ReferralModalContext.Provider value={value}>
      {children}

      {/* Single modal instance shared across the page */}
      <dialog
        ref={dialogRef}
        aria-label={copy.card.title}
        // Click on backdrop closes the dialog. The native <dialog> element
        // makes the backdrop the dialog itself when there's no inner box,
        // so we wrap content in a stop-click div to prevent backdrop clicks
        // from bubbling into the close handler.
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        className="m-0 w-full max-w-lg rounded-2xl border border-border bg-background p-0 shadow-2xl backdrop:bg-text-primary/40 backdrop:backdrop-blur-sm sm:m-auto"
      >
        <div className="relative max-h-[85vh] overflow-y-auto p-5 sm:p-6">
          <button
            type="button"
            onClick={close}
            aria-label={closeLabel}
            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-deep"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
          <ReferralCardView
            copy={copy}
            referralUrl={data.referralUrl}
            count={data.count}
            activatedAt={data.activatedAt}
            fullName={data.fullName}
            lang={data.lang}
          />
        </div>
      </dialog>
    </ReferralModalContext.Provider>
  );
}
