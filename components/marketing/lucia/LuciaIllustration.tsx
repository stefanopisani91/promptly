// Stylized illustration of Lucia for the landing demo. Pure inline SVG —
// no external assets, no PNGs. Two warm tones from the project palette
// (cream `#efe4d7` background + terracotta `#c97c5e` silhouette) to feel
// on-brand without competing visually with the surrounding UI.

interface Props {
  ariaLabel: string;
  className?: string;
}

export function LuciaIllustration({ ariaLabel, className }: Props) {
  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      viewBox="0 0 200 200"
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
    >
      <defs>
        <clipPath id="lucia-clip">
          <circle cx="100" cy="100" r="98" />
        </clipPath>
      </defs>

      {/* Warm cream backdrop circle */}
      <circle cx="100" cy="100" r="98" fill="#efe4d7" />

      <g clipPath="url(#lucia-clip)">
        {/* Shoulders / sweater — brand orange, slightly muted */}
        <path
          d="M 20 200 C 20 158, 60 138, 100 138 C 140 138, 180 158, 180 200 Z"
          fill="#e8703f"
        />

        {/* Neck — warm skin tone */}
        <rect x="86" y="118" width="28" height="28" rx="6" fill="#f0c9a8" />

        {/* Head — warm skin tone */}
        <circle cx="100" cy="92" r="34" fill="#f0c9a8" />

        {/* Hair — terracotta. Soft wavy bob covering top and sides. */}
        <path
          d="M 64 92
             C 60 60, 78 48, 100 48
             C 124 48, 142 62, 138 96
             L 134 96
             C 134 78, 122 70, 110 72
             C 102 80, 94 82, 84 80
             C 78 88, 76 96, 76 102
             Z"
          fill="#c97c5e"
        />
        {/* Hair side strand */}
        <path
          d="M 138 96
             C 140 110, 138 122, 132 130
             L 124 124
             C 130 116, 132 106, 132 96
             Z"
          fill="#c97c5e"
        />
      </g>

      {/* Subtle inner ring */}
      <circle
        cx="100"
        cy="100"
        r="97"
        fill="none"
        stroke="rgba(0,0,0,0.08)"
        strokeWidth="1"
      />
    </svg>
  );
}
