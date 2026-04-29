"use client";

import { useRouter } from "next/navigation";
import { useMemo, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  className?: string;
}

export function LogoutButton({ label, className }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (pending) return;
    startTransition(async () => {
      await supabase.auth.signOut();
      router.push("/auth");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={cn(
        "rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary",
        pending && "opacity-60",
        className,
      )}
    >
      {label}
    </button>
  );
}
