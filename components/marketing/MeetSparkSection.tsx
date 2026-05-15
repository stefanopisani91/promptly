import type { LandingCopy } from "@/lib/i18n/landing";
import { SparkSphere } from "@/components/promptly/SparkSphere";
import { Reveal } from "./Reveal";
import { TrackOnView } from "./TrackOnView";

interface Props {
  copy: LandingCopy["meetSpark"];
}

/**
 * Renderizza un paragrafo della voce di Spark.
 * Pattern supportati:
 *   - `**testo**` → <strong> in colore text-primary (enfasi neutra)
 *   - `«testo»` → <em> con sfondo highlighter arancione tenue
 * Tutto il resto è plain text in text-secondary.
 */
function renderSparkParagraph(text: string): React.ReactNode {
  const boldParts = text.split(/(\*\*[^*]+\*\*)/g);
  return boldParts.flatMap((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`b-${i}`} className="font-semibold text-text-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const quoteParts = part.split(/(«[^»]+»)/g);
    return quoteParts.map((qp, j) => {
      if (qp.startsWith("«") && qp.endsWith("»")) {
        return (
          <em
            key={`q-${i}-${j}`}
            className="not-italic px-0.5"
            style={{
              backgroundImage:
                "linear-gradient(transparent 70%, rgba(232,112,63,0.15) 70%)",
              color: "var(--text-primary)",
              fontStyle: "italic",
            }}
          >
            {qp}
          </em>
        );
      }
      return <span key={`s-${i}-${j}`}>{qp}</span>;
    });
  });
}

export function MeetSparkSection({ copy }: Props) {
  return (
    <section
      id="meet-spark"
      aria-labelledby="meet-spark-name"
      className="overflow-hidden border-y border-border py-16 sm:py-20 lg:py-24"
    >
      <TrackOnView event="landing_meet_spark_viewed" threshold={0.35} />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(260px,360px)_1fr] lg:gap-16">
          {/* Portrait — placeholder mascotte, decorativo. */}
          <Reveal threshold={0.15}>
            <SparkSphere />
          </Reveal>

          <Reveal className="max-w-xl" threshold={0.15} delayMs={150}>
            <p className="font-mono text-xs font-medium uppercase tracking-[0.06em] text-text-muted">
              {copy.kicker}
            </p>
            <h2
              id="meet-spark-name"
              className="mt-4 font-heading text-3xl font-bold leading-[1.05] tracking-[-0.025em] text-text-primary sm:text-4xl lg:text-5xl"
            >
              {copy.name}
            </h2>

            {copy.paragraphs.map((para, i) => (
              <p
                key={i}
                className="mt-4 text-base leading-relaxed text-text-secondary sm:text-lg"
              >
                {renderSparkParagraph(para)}
              </p>
            ))}

            <div className="mt-6 flex flex-wrap gap-2">
              {copy.rules.map((rule, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-1 font-mono text-[11px] text-text-secondary"
                >
                  <span
                    aria-hidden="true"
                    className="mr-1.5"
                    style={{
                      color: rule.kind === "yes" ? "#2E7D32" : "#C8521F",
                    }}
                  >
                    {rule.kind === "yes" ? "✓" : "✕"}
                  </span>
                  {rule.label}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
