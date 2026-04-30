"use client";

import { useEffect, useRef, useState } from "react";
import { Bug, Sparkles } from "lucide-react";

/**
 * Alternates every INTERVAL_MS between two CTA variants:
 *   A) "Vedi un esempio"  — viola-AI style with sparkle shimmer
 *   B) "Fixa il bug"      — terminal/code style
 *
 * Both scroll to #prompt-evaluator on click.
 */

const INTERVAL_MS = 3200;
const SPARKLE_COUNT = 6;

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

function randomSparkles(): Sparkle[] {
  return Array.from({ length: SPARKLE_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 6 + Math.random() * 8,
    delay: Math.random() * 1.2,
  }));
}

interface Props {
  label: string;
  onClick?: () => void;
}

export function AlternatingDemoButton({ label, onClick }: Props) {
  const [variant, setVariant] = useState<"example" | "bug">("example");
  const [transitioning, setTransitioning] = useState(false);
  const [sparkles, setSparkles] = useState<Sparkle[]>(() => randomSparkles());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // alternate between variants
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTransitioning(true);
      setTimeout(() => {
        setVariant((v) => (v === "example" ? "bug" : "example"));
        setSparkles(randomSparkles());
        setTransitioning(false);
      }, 300);
    }, INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleClick = () => {
    onClick?.();
    const el = document.getElementById("prompt-evaluator");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const isExample = variant === "example";

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isExample ? label : "Fixa il bug"}
      style={
        {
          "--shimmer-from": isExample ? "#a855f7" : "#22c55e",
          "--shimmer-to": isExample ? "#7c3aed" : "#15803d",
        } as React.CSSProperties
      }
      className={[
        "relative inline-flex items-center justify-center gap-2 overflow-hidden",
        "rounded-md px-6 py-3 text-base font-semibold",
        "transition-all duration-300 ease-in-out select-none cursor-pointer",
        transitioning ? "opacity-0 scale-95" : "opacity-100 scale-100",
        isExample
          ? // viola AI variant
            "bg-violet-600 text-white shadow-[0_0_18px_3px_rgba(139,92,246,0.45)] hover:bg-violet-700 hover:shadow-[0_0_24px_6px_rgba(139,92,246,0.55)]"
          : // terminal / bug variant
            "border border-green-500/60 bg-[#0d1117] text-green-400 font-mono text-sm shadow-[0_0_14px_2px_rgba(34,197,94,0.25)] hover:shadow-[0_0_20px_4px_rgba(34,197,94,0.4)] hover:border-green-400",
      ].join(" ")}
    >
      {/* Sparkle particles — only for viola variant */}
      {isExample &&
        sparkles.map((s) => (
          <span
            key={s.id}
            aria-hidden
            className="pointer-events-none absolute animate-ping rounded-full bg-white/80"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              animationDelay: `${s.delay}s`,
              animationDuration: "1.4s",
            }}
          />
        ))}

      {/* Shimmer sweep — only for viola variant */}
      {isExample && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -skew-x-12 animate-[shimmer_2.2s_ease-in-out_infinite]"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.22) 50%, transparent 100%)",
            backgroundSize: "200% 100%",
          }}
        />
      )}

      {/* Icon */}
      {isExample ? (
        <Sparkles className="h-4 w-4 shrink-0" />
      ) : (
        <Bug className="h-4 w-4 shrink-0" />
      )}

      {/* Label */}
      <span className={isExample ? "" : "tracking-wide"}>
        {isExample ? label : "fixa il bug"}
      </span>

      {/* Terminal cursor blink — only for bug variant */}
      {!isExample && (
        <span
          aria-hidden
          className="animate-[blink_1s_step-end_infinite] font-mono text-green-300"
        >
          _
        </span>
      )}
    </button>
  );
}
