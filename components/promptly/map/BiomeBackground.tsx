// Biome background — uses the designer's SVG illustrations from
// /public/biomes/, layered behind the spine and nodes. A subtle gradient
// fade at top/bottom of each section keeps adjacent biomes feeling
// "stitched" rather than abruptly cut.

import Image from "next/image";

import type { PathSlug } from "@/types";

const BG_BY_BIOMA: Record<PathSlug, string> = {
  mindset: "/biomes/biome-mindset.svg",
  prompt: "/biomes/biome-prompt.svg",
  build: "/biomes/biome-build.svg",
  debug: "/biomes/biome-debug.svg",
  ship: "/biomes/biome-ship.svg",
};

interface Props {
  bioma: PathSlug;
  /** Section height in CSS px. */
  height: number;
  /** When true, the path is locked-Pro and we mute the background. */
  muted?: boolean;
}

export function BiomeBackground({ bioma, height, muted = false }: Props) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ height }}
    >
      <Image
        src={BG_BY_BIOMA[bioma]}
        alt=""
        fill
        sizes="(min-width: 1024px) 1080px, 100vw"
        priority={bioma === "mindset"}
        className="object-cover"
        style={{ opacity: muted ? 0.45 : 1 }}
      />
      {/* Top + bottom fade overlays to soften the seam between biomes. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.0) 0%, transparent 12%, transparent 88%, rgba(255,255,255,0.0) 100%)",
        }}
      />
    </div>
  );
}
