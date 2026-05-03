// UI strings for the referral feature. Follows the project's per-feature
// i18n pattern (see lib/i18n/levels.ts).

import type { Lang } from "@/types";

export interface ReferralCopy {
  card: {
    title: string;
    subtitle: string;
    linkLabel: string;
    copyBtn: string;
    shareBtn: string;
    copiedFeedback: string;
    activatedToast: string;
    activatedToastDismiss: string;
    bonusReferrer: string;
  };
  progress: {
    label: string; // "Friends invited:"
    pathYHint: string; // "1 signup away from unlocking PathY"
    pathYUnlocked: string; // "PathY unlocked! 🎉"
  };
  share: {
    nativeTitle: string; // browser share-sheet title
    nativeText: (referrerName: string | null) => string; // share message body
  };
  errors: {
    generic: string;
  };
}

const it: ReferralCopy = {
  card: {
    title: "🤝 Invita un amico",
    subtitle: "Quando si iscrive, voi due guadagnate XP extra.",
    linkLabel: "Il tuo link:",
    copyBtn: "Copia link",
    shareBtn: "Condividi",
    copiedFeedback: "Copiato! ✓",
    activatedToast: "+25 XP — link attivato!",
    activatedToastDismiss: "Chiudi",
    bonusReferrer: "+300 XP per ogni amico che si iscrive",
  },
  progress: {
    label: "Amici invitati:",
    pathYHint: "Manca 1 iscrizione per sbloccare PathY",
    pathYUnlocked: "PathY sbloccata! 🎉",
  },
  share: {
    nativeTitle: "Promptly — Impara con le parole, non col codice",
    nativeText: (referrerName) =>
      referrerName
        ? `${referrerName} ti invita su Promptly. Iscriviti col mio link e guadagniamo entrambi XP bonus 🚀`
        : "Iscriviti a Promptly col mio link e guadagniamo entrambi XP bonus 🚀",
  },
  errors: {
    generic: "Qualcosa è andato storto. Riprova tra un attimo.",
  },
};

const en: ReferralCopy = {
  card: {
    title: "🤝 Invite a friend",
    subtitle: "When they sign up, you both earn bonus XP.",
    linkLabel: "Your link:",
    copyBtn: "Copy link",
    shareBtn: "Share",
    copiedFeedback: "Copied! ✓",
    activatedToast: "+25 XP — link activated!",
    activatedToastDismiss: "Dismiss",
    bonusReferrer: "+300 XP for every friend who signs up",
  },
  progress: {
    label: "Friends invited:",
    pathYHint: "1 signup away from unlocking PathY",
    pathYUnlocked: "PathY unlocked! 🎉",
  },
  share: {
    nativeTitle: "Promptly — Learn to build with words, not code",
    nativeText: (referrerName) =>
      referrerName
        ? `${referrerName} invites you to Promptly. Sign up with my link and we both earn bonus XP 🚀`
        : "Sign up to Promptly with my link and we both earn bonus XP 🚀",
  },
  errors: {
    generic: "Something went wrong. Try again in a moment.",
  },
};

export function getReferralCopy(lang: Lang): ReferralCopy {
  return lang === "it" ? it : en;
}
