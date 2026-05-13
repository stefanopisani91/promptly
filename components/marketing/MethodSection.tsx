import type { LandingCopy } from "@/lib/i18n/landing";
import { Reveal } from "./Reveal";

interface Props {
  copy: LandingCopy["method"];
}

/**
 * Renderizza una stringa con pattern `**testo**` come <em>testo</em>
 * con stile accent. Tutto il resto resta plain text.
 */
function renderBoldAccent(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <em
          key={i}
          className="font-normal not-italic text-primary"
        >
          {part.slice(2, -2)}
        </em>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/** Renderizza una stringa con `**testo**` come strong, niente accent. */
function renderBoldStrong(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-text-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function MethodSection({ copy }: Props) {
  return (
    <section
      id="method"
      aria-labelledby="method-kicker"
      className="overflow-hidden border-t border-border py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal threshold={0.25}>
          <p
            id="method-kicker"
            className="font-mono text-xs font-medium uppercase tracking-[0.06em] text-text-muted"
          >
            {copy.kicker}
          </p>
          <h2 className="mt-3 max-w-3xl font-heading text-2xl font-semibold leading-tight tracking-[-0.02em] text-text-primary text-balance sm:text-3xl lg:text-4xl">
            {renderBoldAccent(copy.lead)}
          </h2>
        </Reveal>

        <Reveal
          threshold={0.1}
          className="mt-12 grid max-w-4xl grid-cols-1 gap-8 sm:mt-14 md:grid-cols-2"
        >
          {copy.paragraphs.map((p, i) => (
            <p
              key={i}
              className="text-base leading-relaxed text-text-secondary sm:text-lg"
            >
              <strong className="font-semibold text-text-primary">
                {p.bold}
              </strong>{" "}
              {renderBoldStrong(p.body)}
              {p.quiet ? (
                <>
                  {" "}
                  <span className="text-text-muted">{p.quiet}</span>
                </>
              ) : null}
            </p>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
