/**
 * SparkSphere — sfera arancione liscia con due occhi neri, placeholder
 * della mascotte Spark in attesa dell'illustrazione finale animata.
 *
 * Riusa i tre stili CSS già definiti in app/globals.css
 * (.meet-spark-portrait + .meet-spark-body + .meet-spark-highlight) —
 * zero nuovo CSS, zero nuovo asset.
 *
 * Default behaviour (nessuna prop `size`): mantiene il comportamento
 * originale della landing — width 100% del contenitore, capped a 320px
 * via la classe CSS, aspetto quadrato, centrata con margin auto.
 *
 * Passare `size` quando serve un quadrato a dimensione fissa (es. la
 * welcome card della dashboard).
 *
 * NB: non sostituisce lo Spark V3 delle lezioni (components/lessons/v3/
 * Spark.tsx, basato su /spark.png con 8 stati DALL·E) — quel sistema
 * resta intatto. SparkSphere è il placeholder per le superfici dove la
 * mascotte è solo decorativa.
 */

interface Props {
  /** Lato della sfera in px. Se omesso usa il comportamento responsive
   *  della landing (100% del contenitore, max 320px). */
  size?: number;
  /** Aria-label opzionale quando la sfera è il visual primario. Default:
   *  decorativa (aria-hidden). */
  ariaLabel?: string;
}

export function SparkSphere({ size, ariaLabel }: Props) {
  const style =
    size != null
      ? { width: size, maxWidth: size, margin: 0 }
      : undefined;

  return (
    <div
      className="meet-spark-portrait"
      style={style}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    >
      <div aria-hidden="true" className="meet-spark-body">
        <div className="meet-spark-highlight" />
      </div>
    </div>
  );
}
