// Decorative SVG-icon layer for each path's bioma section.
// Pure server component — no interactivity, no client JS shipped for it.
//
// Density strategy: 12-22 fixed (x%, y%) positions per bioma at 28-56px,
// rendered with enough opacity to feel like part of the world rather
// than a faint texture. y% is relative to the section height, so the
// same set scales correctly across paths with different lesson counts.

import {
  Building,
  Building2,
  Cog,
  Compass,
  Hammer,
  Home,
  Moon,
  Pickaxe,
  Rocket,
  Settings,
  Sparkles,
  Star,
  TentTree,
  TreePine,
  Trees,
  Wrench,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import type { PathSlug } from "@/types";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

interface Decoration {
  x: number; // %
  y: number; // % of section height (0 = top, 100 = bottom)
  size: number; // px
  rotation: number; // deg
  Icon: IconComponent;
}

const MINDSET_DECORATIONS: Decoration[] = [
  { x: 8, y: 6, size: 44, rotation: -6, Icon: Home },
  { x: 88, y: 10, size: 52, rotation: 7, Icon: TentTree },
  { x: 6, y: 22, size: 40, rotation: 4, Icon: Trees },
  { x: 92, y: 28, size: 38, rotation: -5, Icon: Home },
  { x: 12, y: 38, size: 48, rotation: 2, Icon: Home },
  { x: 86, y: 46, size: 44, rotation: -3, Icon: TentTree },
  { x: 4, y: 56, size: 36, rotation: 8, Icon: Trees },
  { x: 90, y: 64, size: 50, rotation: -10, Icon: Home },
  { x: 10, y: 74, size: 42, rotation: 5, Icon: TentTree },
  { x: 88, y: 84, size: 38, rotation: -8, Icon: Trees },
  { x: 6, y: 92, size: 46, rotation: 3, Icon: Home },
  { x: 90, y: 96, size: 34, rotation: -6, Icon: Trees },
];

const PROMPT_DECORATIONS: Decoration[] = [
  { x: 6, y: 4, size: 52, rotation: -4, Icon: TreePine },
  { x: 90, y: 8, size: 48, rotation: 6, Icon: TreePine },
  { x: 14, y: 16, size: 56, rotation: -8, Icon: TreePine },
  { x: 88, y: 22, size: 44, rotation: 3, Icon: TreePine },
  { x: 4, y: 32, size: 48, rotation: 5, Icon: TreePine },
  { x: 92, y: 38, size: 56, rotation: -2, Icon: TreePine },
  { x: 10, y: 48, size: 42, rotation: 7, Icon: Trees },
  { x: 88, y: 54, size: 50, rotation: -5, Icon: TreePine },
  { x: 6, y: 64, size: 54, rotation: 4, Icon: TreePine },
  { x: 90, y: 72, size: 46, rotation: -7, Icon: TreePine },
  { x: 12, y: 82, size: 50, rotation: 6, Icon: TreePine },
  { x: 86, y: 88, size: 44, rotation: -3, Icon: Trees },
  { x: 8, y: 96, size: 48, rotation: 4, Icon: TreePine },
];

const BUILD_DECORATIONS: Decoration[] = [
  { x: 6, y: 4, size: 52, rotation: 0, Icon: Building },
  { x: 90, y: 8, size: 44, rotation: 0, Icon: Building2 },
  { x: 12, y: 16, size: 56, rotation: 0, Icon: Building },
  { x: 86, y: 22, size: 48, rotation: 0, Icon: Building2 },
  { x: 4, y: 32, size: 50, rotation: 0, Icon: Building },
  { x: 92, y: 38, size: 56, rotation: 0, Icon: Building2 },
  { x: 8, y: 46, size: 46, rotation: 0, Icon: Building },
  { x: 88, y: 52, size: 52, rotation: 0, Icon: Building2 },
  { x: 14, y: 62, size: 48, rotation: 0, Icon: Building },
  { x: 90, y: 68, size: 56, rotation: 0, Icon: Building2 },
  { x: 6, y: 78, size: 50, rotation: 0, Icon: Building },
  { x: 86, y: 84, size: 44, rotation: 0, Icon: Building2 },
  { x: 10, y: 92, size: 52, rotation: 0, Icon: Building },
  { x: 92, y: 96, size: 46, rotation: 0, Icon: Building2 },
];

const DEBUG_DECORATIONS: Decoration[] = [
  { x: 8, y: 6, size: 48, rotation: -12, Icon: Cog },
  { x: 88, y: 10, size: 42, rotation: 18, Icon: Hammer },
  { x: 4, y: 18, size: 50, rotation: 25, Icon: Settings },
  { x: 92, y: 24, size: 40, rotation: -15, Icon: Wrench },
  { x: 12, y: 34, size: 54, rotation: 10, Icon: Cog },
  { x: 86, y: 40, size: 44, rotation: -22, Icon: Pickaxe },
  { x: 6, y: 52, size: 50, rotation: 8, Icon: Hammer },
  { x: 90, y: 58, size: 42, rotation: -18, Icon: Settings },
  { x: 10, y: 68, size: 48, rotation: 14, Icon: Cog },
  { x: 88, y: 74, size: 50, rotation: -10, Icon: Wrench },
  { x: 4, y: 84, size: 44, rotation: 22, Icon: Hammer },
  { x: 92, y: 90, size: 46, rotation: -16, Icon: Cog },
  { x: 8, y: 96, size: 40, rotation: 12, Icon: Pickaxe },
];

const SHIP_DECORATIONS: Decoration[] = [
  { x: 8, y: 4, size: 22, rotation: 0, Icon: Star },
  { x: 22, y: 9, size: 16, rotation: 0, Icon: Sparkles },
  { x: 78, y: 6, size: 20, rotation: 0, Icon: Star },
  { x: 92, y: 12, size: 24, rotation: 0, Icon: Star },
  { x: 14, y: 18, size: 18, rotation: 0, Icon: Sparkles },
  { x: 60, y: 22, size: 14, rotation: 0, Icon: Star },
  { x: 88, y: 26, size: 26, rotation: -10, Icon: Rocket },
  { x: 6, y: 32, size: 20, rotation: 0, Icon: Sparkles },
  { x: 30, y: 38, size: 18, rotation: 0, Icon: Star },
  { x: 70, y: 42, size: 16, rotation: 0, Icon: Star },
  { x: 92, y: 48, size: 22, rotation: 0, Icon: Sparkles },
  { x: 4, y: 54, size: 24, rotation: 0, Icon: Star },
  { x: 24, y: 58, size: 16, rotation: 0, Icon: Star },
  { x: 84, y: 62, size: 28, rotation: 0, Icon: Moon },
  { x: 12, y: 68, size: 18, rotation: 0, Icon: Sparkles },
  { x: 50, y: 72, size: 20, rotation: 0, Icon: Star },
  { x: 90, y: 76, size: 16, rotation: 0, Icon: Star },
  { x: 6, y: 82, size: 22, rotation: 0, Icon: Sparkles },
  { x: 78, y: 86, size: 24, rotation: 0, Icon: Compass },
  { x: 28, y: 90, size: 18, rotation: 0, Icon: Star },
  { x: 92, y: 94, size: 20, rotation: 0, Icon: Sparkles },
  { x: 14, y: 96, size: 16, rotation: 0, Icon: Star },
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
  const iconColorVar = `var(--bioma-${bioma}-icon)`;

  // Tuned for visibility — earlier values were too faint to register.
  const baseOpacity = isSpace ? 0.85 : 0.42;
  const finalOpacity = muted ? 0.16 : baseOpacity;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        height,
        background: `linear-gradient(to bottom, var(--bioma-${bioma}-bg), var(--bioma-${bioma}-bg-deep))`,
      }}
    >
      {decorations.map((d, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${d.x}%`,
            // y%=0 is now top of section, y%=100 is bottom — matching
            // the top-down node coordinate system in lib/map/layout.ts.
            top: `${d.y}%`,
            transform: `translate(-50%, -50%) rotate(${d.rotation}deg)`,
            opacity: finalOpacity,
            color: iconColorVar,
          }}
        >
          <d.Icon width={d.size} height={d.size} strokeWidth={1.75} />
        </div>
      ))}
    </div>
  );
}
