import type { DailyGoal, Lang } from "@/types";

export interface OnboardingGoalCard {
  goal: DailyGoal;
  emoji: string;
  title: string;
  description: string;
}

export interface AuthCopy {
  meta: {
    titleAuth: string;
    titleCheckEmail: string;
    titleExpired: string;
    titleOnboarding: string;
    titleDashboard: string;
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
  onboarding: {
    progressLabel: (step: number, total: number) => string;
    continueCta: string;
    finalCta: string;
    submitting: string;
    genericError: string;
    step1: {
      eyebrow: string;
      title: string;
      sub: string;
      label: string;
      placeholder: string;
      errors: {
        empty: string;
        tooLong: string;
        invalidChars: string;
      };
    };
    step2: {
      eyebrow: string;
      title: string;
      sub: string;
      optionIt: string;
      optionEn: string;
    };
    step3: {
      eyebrow: string;
      title: string;
      sub: string;
      cards: OnboardingGoalCard[];
    };
  };
  dashboard: {
    greeting: (name: string) => string;
    stats: {
      xp: string;
      streak: string;
      lessons: string;
    };
    logoutCta: string;
    welcomeCard: {
      title: (name: string) => string;
      sub: string;
      cta: string;
      submitting: string;
    };
  };
}

const it: AuthCopy = {
  meta: {
    titleAuth: "Accedi a Promptly",
    titleCheckEmail: "Controlla la tua email",
    titleExpired: "Link scaduto",
    titleOnboarding: "Iniziamo — Promptly",
    titleDashboard: "Dashboard — Promptly",
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
  onboarding: {
    progressLabel: (step, total) => `Passo ${step} di ${total}`,
    continueCta: "Continua →",
    finalCta: "Inizia a imparare →",
    submitting: "Sto preparando tutto...",
    genericError: "Qualcosa è andato storto. Riprova tra un attimo.",
    step1: {
      eyebrow: "STEP 1 DI 3",
      title: "Come ti chiamiamo?",
      sub: "Vediamo il tuo nome quando torni. Niente di formale.",
      label: "Nome",
      placeholder: "Es. Stefano",
      errors: {
        empty: "Scrivi il tuo nome per continuare.",
        tooLong: "Massimo 40 caratteri.",
        invalidChars: "Usa solo lettere, numeri, spazi e trattini.",
      },
    },
    step2: {
      eyebrow: "STEP 2 DI 3",
      title: "In che lingua vuoi imparare?",
      sub: "Puoi cambiarla in qualsiasi momento dalle impostazioni.",
      optionIt: "🇮🇹  Italiano",
      optionEn: "🇬🇧  English",
    },
    step3: {
      eyebrow: "STEP 3 DI 3",
      title: "Quanto tempo vuoi dedicarci ogni giorno?",
      sub: "Le streak partono da qui. Tranquillo, puoi cambiarla quando vuoi.",
      cards: [
        {
          goal: "trivial",
          emoji: "🌱",
          title: "Solo un assaggio",
          description: "5 minuti al giorno · ~1 lezione breve",
        },
        {
          goal: "easy",
          emoji: "📘",
          title: "Progresso costante",
          description: "10 minuti al giorno · ~1-2 lezioni",
        },
        {
          goal: "pro",
          emoji: "🚀",
          title: "Massima concentrazione",
          description: "15 minuti al giorno · ~2-3 lezioni",
        },
      ],
    },
  },
  dashboard: {
    greeting: (name: string) => `Bentornato, ${name}`,
    stats: {
      xp: "XP totali",
      streak: "Streak attuale",
      lessons: "Lezioni completate",
    },
    logoutCta: "Esci",
    welcomeCard: {
      title: (name: string) => `🎉 Benvenuto in Promptly, ${name}!`,
      sub: "Inizia con la prima lezione: \"Cos'è il vibe coding?\"",
      cta: "Inizia →",
      submitting: "Un attimo...",
    },
  },
};

const en: AuthCopy = {
  meta: {
    titleAuth: "Sign in to Promptly",
    titleCheckEmail: "Check your email",
    titleExpired: "Link expired",
    titleOnboarding: "Let's get started — Promptly",
    titleDashboard: "Dashboard — Promptly",
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
  onboarding: {
    progressLabel: (step, total) => `Step ${step} of ${total}`,
    continueCta: "Continue →",
    finalCta: "Start learning →",
    submitting: "Setting things up...",
    genericError: "Something went wrong. Try again in a moment.",
    step1: {
      eyebrow: "STEP 1 OF 3",
      title: "What should we call you?",
      sub: "We'll greet you by name when you come back. Nothing formal.",
      label: "Name",
      placeholder: "e.g. Stefano",
      errors: {
        empty: "Type your name to continue.",
        tooLong: "Maximum 40 characters.",
        invalidChars: "Use only letters, numbers, spaces and hyphens.",
      },
    },
    step2: {
      eyebrow: "STEP 2 OF 3",
      title: "What language do you want to learn in?",
      sub: "You can change it any time from settings.",
      optionIt: "🇮🇹  Italiano",
      optionEn: "🇬🇧  English",
    },
    step3: {
      eyebrow: "STEP 3 OF 3",
      title: "How much time can you dedicate daily?",
      sub: "Your streak starts here. Don't worry, you can change it anytime.",
      cards: [
        {
          goal: "trivial",
          emoji: "🌱",
          title: "Just a taste",
          description: "5 min/day · ~1 short lesson",
        },
        {
          goal: "easy",
          emoji: "📘",
          title: "Steady progress",
          description: "10 min/day · ~1-2 lessons",
        },
        {
          goal: "pro",
          emoji: "🚀",
          title: "Full focus",
          description: "15 min/day · ~2-3 lessons",
        },
      ],
    },
  },
  dashboard: {
    greeting: (name: string) => `Welcome back, ${name}`,
    stats: {
      xp: "Total XP",
      streak: "Current streak",
      lessons: "Lessons completed",
    },
    logoutCta: "Log out",
    welcomeCard: {
      title: (name: string) => `🎉 Welcome to Promptly, ${name}!`,
      sub: "Start with the first lesson: \"What is vibe coding?\"",
      cta: "Start →",
      submitting: "One moment...",
    },
  },
};

export function getAuthCopy(lang: Lang): AuthCopy {
  return lang === "it" ? it : en;
}
