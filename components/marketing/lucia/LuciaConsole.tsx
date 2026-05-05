// Console errors block — sits as the bottom half of the unified left
// vignette. Round 5: stripped down to ONLY the two error lines (red), no
// `npm run dev` chatter, no header chrome. The simpler signal-to-noise
// helps non-tech users spot the bug instantly.

import type { LuciaDemoCopy } from "@/lib/landing-demo/types";

interface Props {
  copy: LuciaDemoCopy["console"];
}

export function LuciaConsole({ copy }: Props) {
  return (
    <div
      style={{
        background: "var(--tool-bg)",
        // Round 6 spec: vertical padding 12px (horizontal stays 20px).
        padding: "12px 20px",
        fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
      }}
    >
      <pre
        aria-label="terminal output"
        style={{
          margin: 0,
          // Round 6 spec: 12px.
          fontSize: 12,
          lineHeight: 1.5,
          color: "var(--tool-error)",
          background: "transparent",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {copy.errorLine1}
        {"\n"}
        {copy.errorLine2}
      </pre>
    </div>
  );
}
