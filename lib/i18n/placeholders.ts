import type { Lang } from "@/types";

/**
 * Copy for placeholder pages used during pre-launch:
 * `/signup`, `/login`, `/{lang}/privacy`, `/{lang}/terms`, `/{lang}/cookie`.
 *
 * These are real on-brand pages (not 404s) so traffic from the landing
 * doesn't dead-end while the product is being finished.
 */
export interface PlaceholderCopy {
  backToLandingLabel: string;
  signup: {
    eyebrow: string;
    title: string;
    body: string;
    primaryCtaLabel: string;
    /** Anchor on the landing page — the closest thing to "signing up" today. */
    primaryCtaAnchor: string;
  };
  login: {
    eyebrow: string;
    title: string;
    body: string;
  };
  privacy: {
    eyebrow: string;
    title: string;
    body: string;
  };
  terms: {
    eyebrow: string;
    title: string;
    body: string;
  };
  cookie: {
    eyebrow: string;
    title: string;
    body: string;
  };
}

const placeholderCopyIt: PlaceholderCopy = {
  backToLandingLabel: "Torna alla landing",
  signup: {
    eyebrow: "PRE-LANCIO",
    title: "Stiamo preparando tutto.",
    body:
      "Promptly è in pre-lancio. Il corso completo sarà disponibile prima dell'estate. Nel frattempo puoi provare una lezione gratis adesso — è la cosa più vicina all'iscrizione che possiamo offrirti oggi.",
    primaryCtaLabel: "Prova una lezione",
    primaryCtaAnchor: "#exercise-demo",
  },
  login: {
    eyebrow: "PRE-LANCIO",
    title: "Account in arrivo.",
    body:
      "Promptly è in pre-lancio: per ora non ci sono ancora account da cui accedere. Vuoi essere tra i primi a iscriverti? Torna alla landing — da lì puoi provare il corso e vedere come funziona.",
  },
  privacy: {
    eyebrow: "INFORMATIVA PRIVACY",
    title: "Stiamo finalizzando la nostra Privacy Policy.",
    body:
      "La versione definitiva sarà online prima del lancio pubblico. Nel frattempo: non vendiamo i tuoi dati, non usiamo dark pattern e raccogliamo solo quello che ci serve per migliorare il prodotto. Per qualsiasi domanda scrivi a privacy@promptly.app.",
  },
  terms: {
    eyebrow: "TERMINI DI SERVIZIO",
    title: "Stiamo finalizzando i nostri Termini.",
    body:
      "La versione definitiva sarà online prima del lancio pubblico. Le nostre regole si fondano su tre principi: trasparenza nei prezzi, libertà di disdire in ogni momento, nessuna sorpresa. Per qualsiasi domanda scrivi a hello@promptly.app.",
  },
  cookie: {
    eyebrow: "COOKIE",
    title: "Stiamo finalizzando la Cookie Policy.",
    body:
      "La versione definitiva sarà online prima del lancio pubblico. Per ora utilizziamo solo cookie tecnici necessari al funzionamento del sito e analitici aggregati per capire come migliorarlo. Nessun cookie pubblicitario di terze parti. Per qualsiasi domanda scrivi a privacy@promptly.app.",
  },
};

const placeholderCopyEn: PlaceholderCopy = {
  backToLandingLabel: "Back to landing",
  signup: {
    eyebrow: "PRE-LAUNCH",
    title: "We're putting the finishing touches.",
    body:
      "Promptly is in pre-launch. The full course goes live before summer. In the meantime, try a free lesson now — it's the closest thing to signing up we can offer today.",
    primaryCtaLabel: "Try a lesson",
    primaryCtaAnchor: "#exercise-demo",
  },
  login: {
    eyebrow: "PRE-LAUNCH",
    title: "Accounts coming soon.",
    body:
      "Promptly is in pre-launch — there are no accounts to log into yet. Want to be among the first to sign up? Head back to the landing and you can try the course from there.",
  },
  privacy: {
    eyebrow: "PRIVACY NOTICE",
    title: "We're finalizing our Privacy Policy.",
    body:
      "The full version will be live before public launch. In the meantime: we don't sell your data, we don't use dark patterns, and we only collect what we need to improve the product. Questions? Email privacy@promptly.app.",
  },
  terms: {
    eyebrow: "TERMS OF SERVICE",
    title: "We're finalizing our Terms.",
    body:
      "The full version will be live before public launch. Our rules rest on three principles: transparent pricing, freedom to cancel anytime, no surprises. Questions? Email hello@promptly.app.",
  },
  cookie: {
    eyebrow: "COOKIES",
    title: "We're finalizing our Cookie Policy.",
    body:
      "The full version will be live before public launch. For now we only use technical cookies needed for the site to work and aggregate analytics to understand how to improve it. No third-party advertising cookies. Questions? Email privacy@promptly.app.",
  },
};

export function getPlaceholderCopy(lang: Lang): PlaceholderCopy {
  return lang === "it" ? placeholderCopyIt : placeholderCopyEn;
}
