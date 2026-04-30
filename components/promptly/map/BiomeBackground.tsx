// Decorative SVG-icon layer for each path's bioma section.
// Pure server component — no interactivity, no client JS shipped for it.
//
// Density strategy: 6-8 fixed (x%, y%) positions per bioma. The y% is
// relative to the section height, so the same set scales correctly to a
// 6-lesson path or a 10-lesson path without overlapping the spine nodes.

import {
  Building2,
  Cog,
  Home,
  Hammer,
  Sparkles,
  Star,
  TreePine,
  Trees,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import type { PathSlug } from "@/types";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

interface Decoration {
  x: number; // %
  y: number; // % of section height
  size: number; // px
  rotation: number; // deg
  Icon: IconComponent;
}

const MINDSET_DECORATIONS: Decoration[] = [
  { x: 8, y: 12, size: 32, rotation: -6, Icon: Home },
  { x: 88, y: 20, size: 28, rotation: 7, Icon: Trees },
  { x: 14, y: 42, size: 36, rotation: 2, Icon: Home },
  { x: 82, y: 55, size: 30, rotation: -3, Icon: Trees },
  { x: 6, y: 78, size: 28, rotation: 5, Icon: Trees },
  { x: 90, y: 88, size: 26, rotation: -10, Icon: Home },
];

const PROMPT_DECORATIONS: Decoration[] = [
  { x: 10, y: 8, size: 38, rotation: -4, Icon: TreePine },
  { x: 86, y: 18, size: 34, rotation: 6, Icon: TreePine },
  { x: 6, y: 35, size: 30, rotation: -8, Icon: TreePine },
  { x: 88, y: 48, size: 38, rotation: 3, Icon: TreePine },
  { x: 12, y: 65, size: 34, rotation: 5, Icon: TreePine },
  { x: 84, y: 78, size: 32, rotation: -2, Icon: TreePine },
  { x: 8, y: 92, size: 30, rotation: 4, Icon: TreePine },
];

const BUILD_DECORATIONS: Decoration[] = [
  { x: 6, y: 10, size: 38, rotation: 0, Icon: Building2 },
  { x: 88, y: 18, size: 32, rotation: 0, Icon: Building2 },
  { x: 10, y: 32, size: 36, rotation: 0, Icon: Building2 },
  { x: 84, y: 42, size: 40, rotation: 0, Icon: Building2 },
  { x: 6, y: 58, size: 34, rotation: 0, Icon: Building2 },
  { x: 90, y: 70, size: 38, rotation: 0, Icon: Building2 },
  { x: 8, y: 84, size: 32, rotation: 0, Icon: Building2 },
  { x: 86, y: 92, size: 36, rotation: 0, Icon: Building2 },
];

const DEBUG_DECORATIONS: Decoration[] = [
  { x: 8, y: 14, size: 34, rotation: -12, Icon: Cog },
  { x: 86, y: 22, size: 30, rotation: 18, Icon: Hammer },
  { x: 6, y: 45, size: 38, rotation: 25, Icon: Cog },
  { x: 88, y: 58, size: 28, rotation: -15, Icon: Hammer },
  { x: 10, y: 78, size: 32, rotation: 8, Icon: Cog },
  { x: 84, y: 92, size: 30, rotation: -22, Icon: Hammer },
];

const SHIP_DECORATIONS: Decoration[] = [
  { x: 8, y: 10, size: 16, rotation: 0, Icon: Star },
  { x: 22, y: 18, size: 12, rotation: 0, Icon: Sparkles },
  { x: 78, y: 14, size: 14, rotation: 0, Icon: Star },
  { x: 14, y: 32, size: 10, rotation: 0, Icon: Star },
  { x: 88, y: 36, size: 18, rotation: 0, Icon: Star },
  { x: 30, y: 48, size: 14, rotation: 0, Icon: Sparkles },
  { x: 70, y: 56, size: 12, rotation: 0, Icon: Star },
  { x: 8, y: 64, size: 16, rotation: 0, Icon: Sparkles },
  { x: 92, y: 72, size: 14, rotation: 0, Icon: Star },
  { x: 26, y: 84, size: 12, rotation: 0, Icon: Star },
  { x: 80, y: 92, size: 18, rotation: 0, Icon: Sparkles },
];

const DECORATIONS_BY_BIOMA: Record<PathSlug, Decoration[]> = {
  mindset: MINDSET_DECORATIONS,
  prompt: PROMPT_DECORATIONS,
  build: BUILD_DECORATIONS,
  debug: DEBUG_DECORATIONS,
  ship: SHIP_DECORATIONS,
};

interface Props {
  bioma: PathSlug;
  /** Section height in CSS px — used to position icons proportionally. */
  height: number;
  /** When true, the path is locked-Pro and we mute the decorations. */
  muted?: boolean;
}

export function BiomeBackground({ bioma, height, muted = false }: Props) {
  const decorations = DECORATIONS_BY_BIOMA[bioma];
  const isSpace = bioma === "ship";
  const iconColorVar = isSpace ? "var(--bioma-ship-icon)" : `var(--bioma-${bioma}-icon)`;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        height,
        background: `linear-gradient(to top, var(--bioma-${bioma}-bg-deep), var(--bioma-${bioma}-bg))`,
      }}
    >
      {decorations.map((d, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${d.x}%`,
            // y%=0 is bottom of section, y%=100 is top — match the
            // bottom-up coordinate system used for nodes.
            bottom: `${d.y}%`,
            transform: `translate(-50%, 50%) rotate(${d.rotation}deg)`,
            opacity: muted ? 0.12 : isSpace ? 0.6 : 0.18,
            color: iconColorVar,
          }}
        >
          <d.Icon width={d.size} height={d.size} strokeWidth={1.5} />
        </div>
      ))}
    </div>
  );
}
