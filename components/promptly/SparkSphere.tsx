/**
 * SparkSphere — sfera arancione liscia con due occhi neri, mascotte
 * canonica di Spark in tutta l'app.
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
 * welcome card della dashboard, i 28-84px delle lezioni).
 *
 * Il prop `state` è accettato per preservare i trigger emotivi del
 * vecchio componente Spark (idle / thinking / happy / surprised / sad /
 * listening): oggi non altera il visual (la sfera resta neutra) ma
 * viene riflesso come data-state per future micro-animazioni e per non
 * perdere semanticamente la reazione che lo step esprime.
 */

import type { SparkState } from "@/types";

interface Props {
  /** Lato della sfera in px. Se omesso usa il comportamento responsive
   *  della landing (100% del contenitore, max 320px). */
  size?: number;
  /** Aria-label opzionale quando la sfera è il visual primario. Default:
   *  decorativa (aria-hidden). */
  ariaLabel?: string;
  /** Trigger emotivo dello step. Preservato come data-attribute; oggi
   *  non altera il visual (sphere placeholder), ma mantiene la
   *  semantica per future evoluzioni. */
  state?: SparkState;
}

export function SparkSphere({ size, ariaLabel, state = "idle" }: Props) {
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
      data-spark-state={state}
    >
      <div aria-hidden="true" className="meet-spark-body">
        <div className="meet-spark-highlight" />
      </div>
    </div>
  );
}
