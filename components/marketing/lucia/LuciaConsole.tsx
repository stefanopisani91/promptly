// Console errors block — sits as the bottom strip of the unified left
// vignette. Editorial pass (May 2026): the dark "terminal" banda è stata
// sostituita da una hairline-left rossa su sfondo neutro, in linea col
// dialetto editoriale della landing. Restano solo le due righe d'errore
// in mono micro per dare il segnale "qualcosa è rotto" senza più
// chrome scuro che competeva col resto della sezione.

import type { LuciaDemoCopy } from "@/lib/landing-demo/types";

interface Props {
  copy: LuciaDemoCopy["console"];
}

export function LuciaConsole({ copy }: Props) {
  return (
    <div
      style={{
        background: "var(--surface)",
        padding: "12px 14px",
        borderTop: "1px solid var(--border)",
        borderLeft: "2px solid #c8521f",
        fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
      }}
    >
      <pre
        aria-label="terminal output"
        style={{
          margin: 0,
          fontSize: 11,
          lineHeight: 1.55,
          color: "#c8521f",
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
