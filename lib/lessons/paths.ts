import type { PathSlug } from "@/types";

// Single source of truth for path metadata. The expected lesson count is what
// gates Path 2 (mindset must be fully completed before prompt unlocks). The
// actual JSON content can ship one lesson at a time without changing the gate.
export interface PathMeta {
  slug: PathSlug;
  totalLessons: number;
  // Order in which paths must be completed. `null` = always unlocked.
  prerequisitePath: PathSlug | null;
  isMvp: boolean;
}

export const PATH_META: Record<PathSlug, PathMeta> = {
  mindset: { slug: "mindset", totalLessons: 6, prerequisitePath: null, isMvp: true },
  prompt: { slug: "prompt", totalLessons: 8, prerequisitePath: "mindset", isMvp: true },
  build: { slug: "build", totalLessons: 10, prerequisitePath: "prompt", isMvp: false },
  debug: { slug: "debug", totalLessons: 6, prerequisitePath: "build", isMvp: false },
  ship: { slug: "ship", totalLessons: 8, prerequisitePath: "debug", isMvp: false },
};

export const PATH_ORDER: readonly PathSlug[] = [
  "mindset",
  "prompt",
  "build",
  "debug",
  "ship",
] as const;
