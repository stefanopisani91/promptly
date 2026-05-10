"use client";

// Floating "write here" hint shown above the Lucia prompt textarea on
// first paint. Real users (Stefano's relatives, May 2026) consistently
// missed that the textarea was where THEY were supposed to write — they
// thought the demo was a passive showcase. The overlay turns that
// affordance into a directional cue: a downward arrow + a single
// imperative line, with a soft bounce so the eye lands on it before
// the rest of the editor.
//
// The overlay disappears with a 300ms fade as soon as the user signals
// they understood the affordance — focus, first keystroke, or
// pre-filled content (returning visitor with a draft in memory).
// Reduced-motion users get the static version (no bounce) and still
// the fade.

import { useEffect, useState } from "react";
import { ArrowDown } from "lucide-react";

interface Props {
  /** Long copy used at ≥768px viewport. */
  textDesktop: string;
  /** Short copy used at <768px viewport. */
  textMobile: string;
  /** Set to false to dismiss the overlay (focus, content, logged-in,
   * etc.). The component handles its own 300ms fade-out animation. */
  visible: boolean;
}

export function LuciaWriteHereOverlay({
  textDesktop,
  textMobile,
  visible,
}: Props) {
  // Two-stage state: when `visible` flips false we keep the element
  // mounted for the fade-out duration, then unmount entirely so it's
  // out of the accessibility tree.
  const [mounted, setMounted] = useState(visible);
  const [opacity, setOpacity] = useState(visible ? 1 : 0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      // Delay the opacity bump by one frame so the initial mount
      // animates from 0 → 1 instead of popping in.
      const t = window.requestAnimationFrame(() => setOpacity(1));
      return () => window.cancelAnimationFrame(t);
    }
    // Hiding: fade out, then unmount.
    setOpacity(0);
    const t = window.setTimeout(() => setMounted(false), 320);
    return () => window.clearTimeout(t);
  }, [visible]);

  if (!mounted) return null;

  return (
    <div
      // pointer-events-none on the wrapper so the overlay doesn't
      // intercept clicks meant for the editor underneath.
      className="lucia-write-here-overlay pointer-events-none absolute -top-12 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1 sm:-top-14"
      style={{
        opacity,
        transition: "opacity 300ms ease-out",
      }}
      aria-hidden
    >
      <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-surface px-3 py-1.5 shadow-md shadow-primary/20">
        <span className="text-xs font-semibold text-primary-deep sm:text-sm">
          <span className="hidden sm:inline">{textDesktop}</span>
          <span className="sm:hidden">{textMobile}</span>
        </span>
        <ArrowDown
          className="lucia-write-here-arrow h-4 w-4 text-primary sm:h-5 sm:w-5"
          aria-hidden
        />
      </div>
    </div>
  );
}
