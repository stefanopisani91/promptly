import type { Lang } from "@/types";

export interface AuthCopy {
  meta: {
    titleAuth: string;
    titleCheckEmail: string;
    titleExpired: string;
    description: string;
  };
  shell: {
    langToggleLabel: string;
    backHomeLabel: string;
  };
  auth: {
    headline: string;
    googleCta: string;
    googleLoading: string;
    divider: string;
    emailLabel: string;
    emailPlaceholder: string;
    submitCta: string;
    submitLoading: string;
    reassurance: string;
    fineprint: {
      lead: string;
      terms: string;
      and: string;
      privacy: string;
    };
    errors: {
      invalid: string;
      rateLimit: string;
      generic: string;
    };
  };
  checkEmail: {
    title: string;
    sub: (email: string) => string;
    microcopy: string;
    changeEmailCta: string;
  };
  expired: {
    title: string;
    sub: string;
    emailLabel: string;
    emailPlaceholder: string;
    submitCta: string;
    submitLoading: string;
    googleAlternative: string;
    errors: {
      invalid: string;
      rateLimit: string;
      generic: string;
    };
  };
}

const it: AuthCopy = {
  meta: {
    titleAuth: "Accedi a Promptly",
    titleCheckEmail: "Controlla la tua email",
    titleExpired: "Link scaduto",
    description:
      "Accedi a Promptly e inizia a costruire con le parole, non col codice.",
  },
  shell: {
    langToggleLabel: "Cambia lingua",
    backHomeLabel: "Torna alla home",
  },
  auth: {
    headline: "Inizia a costruire con le parole, non col codice.",
    googleCta: "Continua con Google",
    googleLoading: "Apertura Google...",
    divider: "o",
    emailLabel: "Email",
    emailPlaceholder: "tuonome@esempio.com",
    submitCta: "Inviami il link →",
    submitLoading: "Sto inviando il link...",
    reassurance: "Niente password. Ti mandiamo un link per entrare al volo.",
    fineprint: {
      lead: "Continuando, accetti i ",
      terms: "Termini",
      and: " e la ",
      privacy: "Privacy Policy",
    },
    errors: {
      invalid: "Questa email non sembra valida.",
      rateLimit: "Troppi tentativi, riprova tra un minuto.",
      generic: "Qualcosa è andato storto. Riprova tra un attimo.",
    },
  },
  checkEmail: {
    title: "Controlla la tua email",
    sub: (email: string) =>
      `Abbiamo mandato un link a ${email}. Cliccaci sopra per entrare.`,
    microcopy:
      "Il link è valido per 15 minuti. Non lo trovi? Controlla in spam.",
    changeEmailCta: "Cambia email",
  },
  expired: {
    title: "Questo link non funziona più",
    sub: "I link magici durano 15 minuti per sicurezza. Te ne mandiamo uno nuovo subito.",
    emailLabel: "Email",
    emailPlaceholder: "tuonome@esempio.com",
    submitCta: "Reinvia il link →",
    submitLoading: "Sto inviando il link...",
    googleAlternative: "Usa Google invece",
    errors: {
      invalid: "Questa email non sembra valida.",
      rateLimit: "Troppi tentativi, riprova tra un minuto.",
      generic: "Qualcosa è andato storto. Riprova tra un attimo.",
    },
  },
};

const en: AuthCopy = {
  meta: {
    titleAuth: "Sign in to Promptly",
    titleCheckEmail: "Check your email",
    titleExpired: "Link expired",
    description:
      "Sign in to Promptly and start building with words, not code.",
  },
  shell: {
    langToggleLabel: "Change language",
    backHomeLabel: "Back to home",
  },
  auth: {
    headline: "Start building with words, not code.",
    googleCta: "Continue with Google",
    googleLoading: "Opening Google...",
    divider: "or",
    emailLabel: "Email",
    emailPlaceholder: "yourname@example.com",
    submitCta: "Send me the link →",
    submitLoading: "Sending the link...",
    reassurance: "No password. We'll send you a link to log in instantly.",
    fineprint: {
      lead: "By continuing, you agree to the ",
      terms: "Terms",
      and: " and ",
      privacy: "Privacy Policy",
    },
    errors: {
      invalid: "That doesn't look like a valid email.",
      rateLimit: "Too many attempts, try again in a minute.",
      generic: "Something went wrong. Try again in a moment.",
    },
  },
  checkEmail: {
    title: "Check your email",
    sub: (email: string) =>
      `We sent a link to ${email}. Click it to log in.`,
    microcopy:
      "The link is valid for 15 minutes. Can't find it? Check your spam folder.",
    changeEmailCta: "Change email",
  },
  expired: {
    title: "This link doesn't work anymore",
    sub: "Magic links expire after 15 minutes for security. We'll send you a fresh one right away.",
    emailLabel: "Email",
    emailPlaceholder: "yourname@example.com",
    submitCta: "Resend the link →",
    submitLoading: "Sending the link...",
    googleAlternative: "Use Google instead",
    errors: {
      invalid: "That doesn't look like a valid email.",
      rateLimit: "Too many attempts, try again in a minute.",
      generic: "Something went wrong. Try again in a moment.",
    },
  },
};

export function getAuthCopy(lang: Lang): AuthCopy {
  return lang === "it" ? it : en;
}
