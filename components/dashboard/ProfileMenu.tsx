"use client";

// Profile dropdown rendered in the (app) header (Profilazione.md
// §"Icona profilo nella dashboard"). Three entries: Profile, My promises,
// Logout. Initials avatar so we don't add a third-party dicebear hop on
// every page render.
//
// Hand-rolled dropdown — the rest of the codebase doesn't use a popover
// primitive and adding @radix-ui just for this would be overkill.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  fullName: string | null;
  email: string;
  copy: {
    profile: string;
    promises: string;
    logout: string;
    openLabel: string;
  };
}

function initials(fullName: string | null, email: string): string {
  const source = (fullName ?? "").trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProfileMenu({ fullName, email, copy }: Props) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    function onDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (!wrapperRef.current || !target) return;
      if (!wrapperRef.current.contains(target)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleLogout() {
    if (signingOut) return;
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/auth");
    router.refresh();
  }

  return (
    <div ref={wrapperRef} className="relative z-50">
      <button
        type="button"
        aria-label={copy.openLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full bg-primary-light text-sm font-semibold text-primary transition-shadow hover:shadow-[0_0_0_3px_rgba(232,112,63,0.18)]",
          open && "shadow-[0_0_0_3px_rgba(232,112,63,0.25)]",
        )}
      >
        {initials(fullName, email)}
      </button>

      {open ? (
        <div
          role="menu"
          // z-50 + opaque bg-surface so the dropdown sits above any
          // dashboard card that might create its own stacking context
          // (welcome card, path tiles, Spark companion).
          className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-semibold text-text-primary">
              {fullName ?? email}
            </p>
            <p className="truncate text-xs text-text-muted">{email}</p>
          </div>
          <div className="flex flex-col py-1.5">
            <Link
              role="menuitem"
              href="/settings/profile"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm text-text-primary hover:bg-surface-muted"
            >
              {copy.profile}
            </Link>
            <Link
              role="menuitem"
              href="/settings/profile#promises"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm text-text-primary hover:bg-surface-muted"
            >
              {copy.promises}
            </Link>
            <button
              role="menuitem"
              type="button"
              onClick={handleLogout}
              disabled={signingOut}
              className="px-4 py-2 text-left text-sm text-text-primary hover:bg-surface-muted disabled:opacity-60"
            >
              {copy.logout}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
