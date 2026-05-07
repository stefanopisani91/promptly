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
    continueCard: {
      eyebrow: string;
      lessonNumberLabel: (n: number) => string;
      resumeCta: string;
      minutesLabel: string;
    };
    dailyGoal: {
      eyebrow: string;
      minutesToGo: (mins: number) => string;
      minutesDoneOf: (done: number, total: number) => string;
      goalReached: string;
    };
    pathsGrid: {
      title: string;
      completedBadge: string;
      lockedHint: string;
    };
    sparkCompanion: {
      eyebrow: string;
      sparkLabel: string;
      // Rotating Spark-voice messages. The card cycles through them based
      // on the user's state. Voice rules from PROMPTLY.md: dry, warm, first
      // person, no emoticons, max 1-2 sentences.
      // Greetings are templates: the literal "{name}" is replaced at render
      // time. Strings (not functions) so the copy can cross the
      // server→client boundary inside SparkCompanionCard's props.
      bubble: {
        greetGeneric: string;
        greetMorning: string;
        greetEvening: string;
        nudgeReferral: string;
        nudgeContinue: string;
        // Shown the first time a user lands on the dashboard with zero
        // lessons completed. Warm, dry, first person — no gamification
        // talk yet (XP/streak come later, after the first lesson).
        nudgeStart: string;
      };
      ctaContinue: string;
      ctaInvite: string;
      ctaStart: string;
    };
    profileMenu: {
      openLabel: string;
      profile: string;
      promises: string;
      logout: string;
    };
  };
  settings: {
    meta: { title: string; description: string };
    pageTitle: string;
    pageSub: string;
    sections: {
      identity: string;
      profile: string;
      promises: string;
      account: string;
    };
    fields: {
      name: string;
      email: string;
      language: string;
      dailyGoal: string;
      experience: string;
      clarity: string;
      project: string;
      tools: string;
      preferredTool: string;
      motivation: string;
      empty: string;
    };
    actions: {
      regenerate: string;
      regenerating: string;
      regenerated: string;
      regenerateError: string;
      // Cooldown / daily-cap messages stay static so the settings page
      // (server component) can pass them straight into the client panel
      // as plain strings — see Round 8b notes in actions.ts.
      regenerateCooldown: string;
      regenerateDailyCap: string;
      restartOnboarding: string;
      back: string;
    };
    promisesLead: string;
    fallbackBadge: string;
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
      generic: "Qualcosa non ha funzionato. Non è colpa tua. Riprova tra un momento.",
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
      generic: "Qualcosa non ha funzionato. Non è colpa tua. Riprova tra un momento.",
    },
  },
  onboarding: {
    progressLabel: (step, total) => `Passo ${step} di ${total}`,
    continueCta: "Continua →",
    finalCta: "Inizia a imparare →",
    submitting: "Sto preparando tutto...",
    genericError: "Qualcosa non ha funzionato. Non è colpa tua. Riprova tra un momento.",
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
      title: (name: string) => `Benvenuto in Promptly, ${name}.`,
      sub: "Inizia il tuo percorso. Cinque minuti veri.",
      cta: "Inizia →",
      submitting: "Un attimo...",
    },
    continueCard: {
      eyebrow: "CONTINUA",
      lessonNumberLabel: (n: number) => `Lezione ${String(n).padStart(2, "0")}`,
      resumeCta: "Riprendi",
      minutesLabel: "min",
    },
    dailyGoal: {
      eyebrow: "OBIETTIVO DI OGGI",
      minutesToGo: (mins: number) =>
        mins === 1 ? "1 minuto al traguardo" : `${mins} minuti al traguardo`,
      minutesDoneOf: (done: number, total: number) => `${done} di ${total} min`,
      goalReached: "Obiettivo raggiunto.",
    },
    pathsGrid: {
      title: "I tuoi percorsi",
      completedBadge: "Completato",
      lockedHint: "Bloccato",
    },
    sparkCompanion: {
      eyebrow: "SPARK",
      sparkLabel: "Spark, la tua compagna di percorso",
      bubble: {
        greetGeneric: "Ciao {name}. Cosa facciamo oggi?",
        greetMorning: "Buongiorno {name}. Da dove iniziamo?",
        greetEvening: "Sei tornato, {name}. Riprendiamo.",
        nudgeReferral:
          "Se porti con te qualcuno, ti sblocco un percorso bonus.",
        nudgeContinue: "La prossima lezione ti aspetta. Cinque minuti.",
        nudgeStart: "Sei arrivato. Ti aspettavo. Cominciamo dalla prima lezione.",
      },
      ctaContinue: "Riprendi",
      ctaInvite: "Invita un amico",
      ctaStart: "Inizia la prima lezione",
    },
    profileMenu: {
      openLabel: "Apri il menu profilo",
      profile: "Profilo",
      promises: "Le mie promesse",
      logout: "Esci",
    },
  },
  settings: {
    meta: {
      title: "Impostazioni — Promptly",
      description: "Gestisci profilo e promesse di Spark.",
    },
    pageTitle: "Il tuo profilo",
    pageSub: "Spark si ricorda di te grazie a queste informazioni.",
    sections: {
      identity: "Identità",
      profile: "Profilazione",
      promises: "Le promesse di Spark",
      account: "Account",
    },
    fields: {
      name: "Nome",
      email: "Email",
      language: "Lingua",
      dailyGoal: "Tempo al giorno",
      experience: "Livello di esperienza",
      clarity: "Chiarezza progetto",
      project: "Il tuo progetto",
      tools: "Tool che hai usato",
      preferredTool: "Tool preferito",
      motivation: "Cosa ti ha portato qui",
      empty: "—",
    },
    actions: {
      regenerate: "Aggiorna le promesse di Spark",
      regenerating: "Spark sta cucendo nuove promesse...",
      regenerated: "Promesse aggiornate.",
      regenerateError:
        "Non sono riuscita a generare nuove promesse. Riprova tra un momento.",
      regenerateCooldown:
        "Aspetta un attimo prima di chiedermi di nuovo. Ho appena finito.",
      regenerateDailyCap:
        "Ho già cucito le tue promesse abbastanza volte oggi. Torna domani.",
      restartOnboarding: "Rifai la profilazione",
      back: "← Torna alla dashboard",
    },
    promisesLead:
      "Tre promesse che Spark ti ha fatto a fine onboarding. Servono per ricordarti perché hai cominciato.",
    fallbackBadge: "Set di emergenza",
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
      generic: "Something didn't work. Not your fault. Try again in a moment.",
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
      generic: "Something didn't work. Not your fault. Try again in a moment.",
    },
  },
  onboarding: {
    progressLabel: (step, total) => `Step ${step} of ${total}`,
    continueCta: "Continue →",
    finalCta: "Start learning →",
    submitting: "Setting things up...",
    genericError: "Something didn't work. Not your fault. Try again in a moment.",
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
      title: (name: string) => `Welcome to Promptly, ${name}.`,
      sub: "Start your path. Five real minutes.",
      cta: "Start →",
      submitting: "One moment...",
    },
    continueCard: {
      eyebrow: "CONTINUE",
      lessonNumberLabel: (n: number) => `Lesson ${String(n).padStart(2, "0")}`,
      resumeCta: "Resume",
      minutesLabel: "min",
    },
    dailyGoal: {
      eyebrow: "TODAY'S GOAL",
      minutesToGo: (mins: number) =>
        mins === 1 ? "1 minute to go" : `${mins} minutes to go`,
      minutesDoneOf: (done: number, total: number) => `${done} of ${total} min`,
      goalReached: "Goal reached.",
    },
    pathsGrid: {
      title: "Your paths",
      completedBadge: "Completed",
      lockedHint: "Locked",
    },
    sparkCompanion: {
      eyebrow: "SPARK",
      sparkLabel: "Spark, your learning companion",
      bubble: {
        greetGeneric: "Hey {name}. What are we doing today?",
        greetMorning: "Morning {name}. Where shall we start?",
        greetEvening: "Welcome back, {name}. Let's pick up.",
        nudgeReferral:
          "Bring a friend along — I'll unlock a bonus path for you.",
        nudgeContinue: "Your next lesson is waiting. Five minutes.",
        nudgeStart: "You made it. I was waiting. Let's start with lesson one.",
      },
      ctaContinue: "Resume",
      ctaInvite: "Invite a friend",
      ctaStart: "Start the first lesson",
    },
    profileMenu: {
      openLabel: "Open profile menu",
      profile: "Profile",
      promises: "My promises",
      logout: "Log out",
    },
  },
  settings: {
    meta: {
      title: "Settings — Promptly",
      description: "Manage your profile and Spark's promises.",
    },
    pageTitle: "Your profile",
    pageSub: "Spark remembers you thanks to this information.",
    sections: {
      identity: "Identity",
      profile: "Profile",
      promises: "Spark's promises",
      account: "Account",
    },
    fields: {
      name: "Name",
      email: "Email",
      language: "Language",
      dailyGoal: "Daily time",
      experience: "Experience level",
      clarity: "Project clarity",
      project: "Your project",
      tools: "Tools you've used",
      preferredTool: "Preferred tool",
      motivation: "What brought you here",
      empty: "—",
    },
    actions: {
      regenerate: "Refresh Spark's promises",
      regenerating: "Spark is stitching new promises...",
      regenerated: "Promises refreshed.",
      regenerateError: "I couldn't generate new promises. Try again in a moment.",
      regenerateCooldown:
        "Wait a moment before asking again. I just finished.",
      regenerateDailyCap:
        "I've already stitched your promises plenty of times today. Come back tomorrow.",
      restartOnboarding: "Redo the profiling",
      back: "← Back to dashboard",
    },
    promisesLead:
      "Three promises Spark made at the end of onboarding. They exist to remind you why you started.",
    fallbackBadge: "Fallback set",
  },
};

export function getAuthCopy(lang: Lang): AuthCopy {
  return lang === "it" ? it : en;
}
