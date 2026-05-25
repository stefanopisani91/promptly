"use client";

// Review-screen card: shows the 4 picks as chips at the top (tap to
// re-edit the corresponding ingredient) and the fully assembled prompt
// in a JetBrains Mono code block below. The chip → screen mapping is
// the parent's responsibility — this component just emits `onEdit(dim)`.
//
// Includes the Copy / Download .txt secondary actions. They're available
// in the review screen at all times (CLAUDE.md "the artefact is the
// point" — let users grab a draft even before they hit "Chiedi a
// Spark").

import { Copy, Download, Pencil } from "lucide-react";
import type { AnatomyDimension } from "@/types";

export interface AssembledPromptStrings {
  // "{ingredient}: ..." labels for the assembled prompt template tokens.
  // Already localised by the parent; the assembly_template carries the
  // structure, not the labels.
  copyCta: string;
  copySuccessLabel: string;
  downloadCta: string;
  // Aria + visible label on each chip — "Modifica {dim}".
  editChipTemplate: string;
  dimensionLabels: Record<AnatomyDimension, string>;
}

interface ChipState {
  dim: AnatomyDimension;
  // Short text shown on the chip (the picked tile's label / task excerpt).
  // Trimmed to ~28 chars by the parent.
  preview: string;
}

interface Props {
  chips: ChipState[];
  assembledPrompt: string;
  // Filename used by the download CTA (extension is .txt).
  downloadBaseName: string;
  strings: AssembledPromptStrings;
  onEdit: (dim: AnatomyDimension) => void;
  // Disable chip taps while the API call is in flight (avoids losing the
  // about-to-be-graded state on a stray tap).
  disabled?: boolean;
  // Copy/Download row hide flag — used to lock the actions once the
  // widget is fully done (post-victory + advance), so the card behaves
  // like read-only history.
  hideActions?: boolean;
}

const ACCENT_VAR: Record<AnatomyDimension, string> = {
  context: "var(--anatomy-context)",
  task: "var(--anatomy-task)",
  constraints: "var(--anatomy-constraints)",
  format: "var(--anatomy-format)",
};

export function AssembledPromptCard({
  chips,
  assembledPrompt,
  downloadBaseName,
  strings,
  onEdit,
  disabled = false,
  hideActions = false,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => {
          const accent = ACCENT_VAR[c.dim];
          const label = strings.editChipTemplate.replace(
            "{ingredient}",
            strings.dimensionLabels[c.dim],
          );
          return (
            <button
              key={c.dim}
              type="button"
              onClick={() => onEdit(c.dim)}
              disabled={disabled}
              aria-label={label}
              title={label}
              className="anatomy-chip inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                borderColor: accent,
                color: accent,
                backgroundColor: `color-mix(in srgb, ${accent} 8%, var(--surface))`,
                touchAction: "manipulation",
              }}
            >
              <span className="uppercase tracking-wider">
                {strings.dimensionLabels[c.dim]}
              </span>
              <span className="hidden text-text-secondary sm:inline">·</span>
              <span className="hidden max-w-[14rem] truncate text-text-secondary sm:inline">
                {c.preview}
              </span>
              <Pencil size={11} className="opacity-60" />
            </button>
          );
        })}
      </div>

      <pre className="anatomy-prompt-stitch overflow-x-auto rounded-2xl border-2 border-border bg-surface-muted/40 p-4 font-mono text-[12px] leading-relaxed text-text-primary sm:text-sm">
        {assembledPrompt}
      </pre>

      {!hideActions && (
        <div className="flex items-center justify-end gap-2">
          <CopyButton text={assembledPrompt} strings={strings} />
          <DownloadButton
            text={assembledPrompt}
            baseName={downloadBaseName}
            label={strings.downloadCta}
          />
        </div>
      )}
    </div>
  );
}

function CopyButton({
  text,
  strings,
}: {
  text: string;
  strings: AssembledPromptStrings;
}) {
  function handleCopy() {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard.writeText(text).catch(() => {
      /* silent — clipboard can be blocked on insecure contexts */
    });
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary transition-colors hover:bg-surface-muted"
      style={{ touchAction: "manipulation" }}
    >
      <Copy size={12} />
      {strings.copyCta}
    </button>
  );
}

function DownloadButton({
  text,
  baseName,
  label,
}: {
  text: string;
  baseName: string;
  label: string;
}) {
  function handleDownload() {
    if (typeof document === "undefined") return;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  return (
    <button
      type="button"
      onClick={handleDownload}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary transition-colors hover:bg-surface-muted"
      style={{ touchAction: "manipulation" }}
    >
      <Download size={12} />
      {label}
    </button>
  );
}
