import type { Lang } from "@/types";

// I 3 documenti vivono sull'account iubenda di learnpromptly.app:
//   - IT  → policy id 64451899
//   - EN  → policy id 23626902
// Le classi CSS `iubenda-white iubenda-noiframe iubenda-embed` sono
// necessarie al loader iubenda per riconoscere il link e aprirlo come
// overlay sopra il sito (anziché redirect a iubenda.com).
// `iubenda-cs-preferences-link` e `iubenda-cs-uspr-link` sono invece
// gestite dal banner cookie: aprono rispettivamente il pannello consensi
// e l'avviso CCPA. Iubenda decide internamente se mostrare l'USP in base
// alla geografia dell'utente — il link va comunque lasciato nel footer.
const COPY = {
  it: {
    heading: "Legale",
    privacy: {
      label: "Privacy Policy",
      href: "https://www.iubenda.com/privacy-policy/64451899",
    },
    cookie: {
      label: "Cookie Policy",
      href: "https://www.iubenda.com/privacy-policy/64451899/cookie-policy",
    },
    terms: {
      label: "Termini e Condizioni",
      href: "https://www.iubenda.com/termini-e-condizioni/64451899",
    },
    preferences: "Le tue preferenze relative alla privacy",
    collection: "Notice at Collection",
  },
  en: {
    heading: "Legal",
    privacy: {
      label: "Privacy Policy",
      href: "https://www.iubenda.com/privacy-policy/23626902",
    },
    cookie: {
      label: "Cookie Policy",
      href: "https://www.iubenda.com/privacy-policy/23626902/cookie-policy",
    },
    terms: {
      label: "Terms and Conditions",
      href: "https://www.iubenda.com/terms-and-conditions/23626902",
    },
    preferences: "Your privacy preferences",
    collection: "Notice at Collection",
  },
} as const;

const LINK_CLASS =
  "text-sm text-text-secondary transition-colors hover:text-text-primary";

export function IubendaLegalLinks({ lang }: { lang: Lang }) {
  const c = COPY[lang];
  return (
    <div>
      <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
        {c.heading}
      </h3>
      <ul className="mt-3 space-y-2">
        <li>
          <a
            href={c.privacy.href}
            className={`iubenda-white iubenda-noiframe iubenda-embed ${LINK_CLASS}`}
            title={c.privacy.label}
          >
            {c.privacy.label}
          </a>
        </li>
        <li>
          <a
            href={c.cookie.href}
            className={`iubenda-white iubenda-noiframe iubenda-embed ${LINK_CLASS}`}
            title={c.cookie.label}
          >
            {c.cookie.label}
          </a>
        </li>
        <li>
          <a
            href={c.terms.href}
            className={`iubenda-white iubenda-noiframe iubenda-embed ${LINK_CLASS}`}
            title={c.terms.label}
          >
            {c.terms.label}
          </a>
        </li>
        <li>
          {/* href="#" è richiesto da iubenda: il loader intercetta il
              click via la classe CSS e apre il pannello consensi. */}
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          <a href="#" className={`iubenda-cs-preferences-link ${LINK_CLASS}`}>
            {c.preferences}
          </a>
        </li>
        <li>
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          <a href="#" className={`iubenda-cs-uspr-link ${LINK_CLASS}`}>
            {c.collection}
          </a>
        </li>
      </ul>
    </div>
  );
}
