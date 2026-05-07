// Bilingual copy for the new 12-step onboarding & profilazione flow
// (Profilazione.md). Lives in its own module to keep auth.ts focused on the
// auth surfaces. Spark's voice rules (PROMPTLY.md "Tono di Spark"): adult,
// dry, first person, max 1-2 sentences per micro-line. No exclamation
// stacks, no emoji inside Spark's prose (UI emoji on option cards is fine).

import type {
  DailyGoal,
  ExperienceLevel,
  Lang,
  ProfilePromises,
  ProjectClarity,
} from "@/types";

export interface ChoiceCardCopy<TKey extends string = string> {
  key: TKey;
  emoji: string;
  label: string;
}

export interface ProfilingCopy {
  meta: { title: string; description: string };
  shell: {
    progressLabel: (current: number, total: number) => string;
    backLabel: string;
    continueCta: string;
    submitting: string;
    genericError: string;
    sparkLabel: string;
  };
  step1: {
    languageHeading: string;
    italian: string;
    english: string;
    sparkLines: string[];
    cta: string;
  };
  step2: {
    sparkIntro: string;
    sparkSub: string;
    inputLabel: string;
    placeholder: string;
    sparkMicro: string;
    errors: { empty: string; tooShort: string; tooLong: string; invalidChars: string };
  };
  step3: {
    sparkIntro: (name: string) => string;
    sparkQuestion: string;
    options: ReadonlyArray<ChoiceCardCopy<ExperienceLevel>>;
  };
  step4: {
    sparkIntro: string;
    options: ReadonlyArray<ChoiceCardCopy<ProjectClarity>>;
    exploringCommentary: string;
  };
  step5: {
    sparkPrecise: string;
    sparkVague: string;
    placeholderPrecise: string;
    placeholderVague: string;
    sparkMicro: string;
    errors: { tooShort: string; tooLong: string };
  };
  step6: {
    sparkIntro: string;
    llmHeading: string;
    ideHeading: string;
    optionOther: string;
    optionNone: string;
    otherPlaceholder: string;
  };
  step7: {
    sparkIntro: string;
    optionNone: string;
    sparkMicro: string;
  };
  step8: {
    sparkIntro: string;
    options: ReadonlyArray<ChoiceCardCopy<DailyGoal>>;
    sparkMicro: string;
  };
  step9: {
    sparkIntroLine1: string;
    sparkIntroLine2: string;
    placeholder: string;
    sparkMicro: string;
    errors: { tooShort: string; tooLong: string };
  };
  step10: {
    sparkIntro: (name: string) => string;
    sparkLead: string;
    sparkConfirm: string;
    confirmCta: string;
    modifyCta: string;
    motivationLead: string;
    fragments: {
      experience: Record<ExperienceLevel, string>;
      clarity: Record<ProjectClarity, string>;
      claritySuffix: {
        precise: (project: string) => string;
        vague: (project: string) => string;
        exploring: string;
      };
      tools: {
        none: string;
        preferred: (toolName: string) => string;
      };
      time: Record<DailyGoal, string>;
      // Joiner stitches the parts into a sentence; the comma list keeps the
      // narrative dry per spec.
      assemble: (parts: {
        experienceFrag: string;
        claritySuffix: string;
        toolsFrag: string;
        timeFrag: string;
      }) => string;
    };
  };
  step11: {
    sparkIntro: string;
    loading: string;
    promiseLabel: (n: number) => string;
    cta: string;
    fallbackPromises: ProfilePromises;
  };
  step12: {
    sparkLine1: (name: string) => string;
    sparkLine2: string;
    cta: string;
  };
  validationErrors: {
    nameRequired: string;
    motivationRequired: string;
  };
}

const DEFAULT_FALLBACK_IT: ProfilePromises = {
  promise_1:
    "Imparerai a parlare con l'AI come si parla a un collaboratore: chiaro, asciutto, senza giri.",
  promise_2:
    "Trasformeremo le tue idee in qualcosa di concreto, una decisione alla volta.",
  promise_3:
    "Quando vorrai mollare, ti aspetterò io. Per quello sono qui.",
  generated_at: "1970-01-01T00:00:00.000Z",
  source: "fallback",
};

const DEFAULT_FALLBACK_EN: ProfilePromises = {
  promise_1:
    "You'll learn to speak to AI the way you'd speak to a teammate: clear, concise, without detours.",
  promise_2:
    "We'll turn your ideas into something concrete, one decision at a time.",
  promise_3:
    "When you want to quit, I'll be here. That's why I exist.",
  generated_at: "1970-01-01T00:00:00.000Z",
  source: "fallback",
};

const it: ProfilingCopy = {
  meta: {
    title: "Iniziamo",
    description:
      "Cinque minuti. Spark ti farà qualche domanda per capire chi ha davanti.",
  },
  shell: {
    progressLabel: (current, total) => `${current} di ${total}`,
    backLabel: "Torna indietro",
    continueCta: "Continua →",
    submitting: "Un attimo...",
    genericError:
      "Qualcosa non ha funzionato. Non è colpa tua. Riprova tra un momento.",
    sparkLabel: "Spark, la tua compagna di percorso",
  },
  step1: {
    languageHeading: "Scegli la tua lingua",
    italian: "🇮🇹 Italiano",
    english: "🇬🇧 English",
    sparkLines: [
      "Ciao. Mi chiamo Spark.",
      "Ti farò qualche domanda nei prossimi minuti. Mi serve per capire chi ho davanti, perché non insegno a tutti allo stesso modo.",
      "Cinque minuti, non di più. Pronto?",
    ],
    cta: "Iniziamo →",
  },
  step2: {
    sparkIntro: "Cominciamo dalla cosa più semplice. Come ti chiami?",
    sparkSub: "Solo il nome — non mi serve altro.",
    inputLabel: "Nome",
    placeholder: "Es. Marco",
    sparkMicro:
      "Io invece sono Spark. “Scintilla”, in inglese. Stefano dice che mi va bene.",
    errors: {
      empty: "Mi serve un nome. Anche di fantasia, se preferisci.",
      tooShort: "Almeno due lettere.",
      tooLong: "Massimo 30 caratteri.",
      invalidChars: "Usa solo lettere, numeri, spazi e trattini.",
    },
  },
  step3: {
    sparkIntro: (name) => `Bene, ${name}. Adesso parliamo di te.`,
    sparkQuestion:
      "Quanto sei già andato avanti con questa cosa di costruire con l'AI?",
    options: [
      { key: "beginner", emoji: "🌱", label: "Mai provato. Sono qui per cominciare da zero." },
      { key: "tried_failed", emoji: "🔧", label: "Ho provato, ma mi sono incartato spesso." },
      { key: "working_on_it", emoji: "⚡", label: "Ci sto già lavorando. Voglio migliorare il metodo." },
      { key: "advanced", emoji: "🚀", label: "Sono avanzato. Cerco una struttura più seria." },
    ],
  },
  step4: {
    sparkIntro:
      "Ok. Adesso una domanda importante: hai già un'idea di cosa vuoi costruire?",
    options: [
      { key: "precise", emoji: "✨", label: "Sì, ho un'idea precisa." },
      { key: "vague", emoji: "💭", label: "Vagamente. Ho intuizioni ma non è chiaro." },
      { key: "exploring", emoji: "🌍", label: "Non ancora. Sto esplorando." },
    ],
    exploringCommentary:
      "Ok. È più normale di quello che pensi. Anche se non sai cosa costruire, ti farò vedere COME farlo, e quali strade ci sono. Promptly funziona anche per chi parte dall'esplorazione.",
  },
  step5: {
    sparkPrecise: "Bene. Raccontamela in poche parole. Cosa vuoi costruire?",
    sparkVague:
      "Va bene così. Dimmi quello che hai in testa, anche se è vago. Non serve sia chiaro.",
    placeholderPrecise:
      "Es. un sito per il mio negozio di fiori, un'app per tracciare gli allenamenti...",
    placeholderVague:
      "Es. qualcosa nel campo del fitness, un tool per la mia agenzia, non sono sicuro...",
    sparkMicro:
      "Tieni a mente quello che scrivi. Te lo richiamerò più avanti, magari quando meno te l'aspetti.",
    errors: {
      tooShort: "Dimmi qualcosa in più. Anche due righe vanno bene.",
      tooLong: "Massimo 300 caratteri.",
    },
  },
  step6: {
    sparkIntro:
      "Adesso una mappa veloce. Quali AI o tool hai già usato? Tocca tutti quelli che riconosci. Se non ne riconosci nessuno, non importa — vai avanti.",
    llmHeading: "Chatbot AI",
    ideHeading: "Editor & strumenti di sviluppo",
    optionOther: "Ho usato altro che non vedo qui",
    optionNone: "Non ho mai usato niente di tutto questo",
    otherPlaceholder: "Quale tool? (opzionale)",
  },
  step7: {
    sparkIntro:
      "Ok, vedo che hai già messo le mani su qualcosa. Tra quelli che hai selezionato, quale ti è sembrato il più tuo? Quello con cui ti trovavi bene.",
    optionNone: "Nessuno mi ha conquistato davvero",
    sparkMicro:
      "Te lo chiedo perché parlo lingue diverse a chi ama Cursor o a chi ama Lovable. Non sono uguali.",
  },
  step8: {
    sparkIntro: "Quanto tempo riesci a darmi al giorno? Non c'è risposta sbagliata.",
    options: [
      { key: "mini", emoji: "✨", label: "5 min — quando ho un attimo libero" },
      { key: "trivial", emoji: "⏱️", label: "10 min — una pausa veloce" },
      { key: "easy", emoji: "📘", label: "15 min — il mio appuntamento giornaliero" },
      { key: "pro", emoji: "⚡", label: "30 min — voglio andare avanti veloce" },
    ],
    sparkMicro: "Anche io ho i miei tempi. Non sempre rapidi.",
  },
  step9: {
    sparkIntroLine1: "Ultima domanda. La più importante.",
    sparkIntroLine2:
      "Cosa ti ha davvero portato qui? Una frustrazione che non riesci a sciogliere, un sogno che vuoi realizzare, una pressione esterna... Dimmi quello che ti viene, in libertà.",
    placeholder:
      "Es. Ho un'idea da 3 anni e non riesco a costruirla / Voglio cambiare lavoro / Sono curioso di capire come funziona davvero...",
    sparkMicro:
      "Quello che mi dirai qui non lo dimentico. Lo userò per tirarti fuori dai momenti in cui vorrai mollare.",
    errors: {
      tooShort: "Dimmi qualcosa in più. Bastano due righe.",
      tooLong: "Massimo 500 caratteri.",
    },
  },
  step10: {
    sparkIntro: (name) => `Bene, ${name}. Ho letto.`,
    sparkLead: "Riassumo per essere sicura di averti capito:",
    sparkConfirm: "Ho capito bene, o c'è qualcosa che voglio rivedere?",
    confirmCta: "Tutto giusto, vai avanti →",
    modifyCta: "Voglio modificare qualcosa",
    motivationLead: "E dietro tutto questo c'è",
    fragments: {
      experience: {
        beginner: "un principiante",
        tried_failed: "uno che ci ha già provato",
        working_on_it: "uno che ci sta già lavorando",
        advanced: "un veterano",
      },
      clarity: {
        precise: "hai un'idea precisa",
        vague: "hai un'idea che sta nascendo",
        exploring: "stai ancora esplorando",
      },
      claritySuffix: {
        precise: (project) => ` su “${project}”`,
        vague: (project) => ` su “${project}”`,
        exploring: "",
      },
      tools: {
        none: "stai cominciando senza tool",
        preferred: (toolName) => `ti senti a casa con ${toolName}`,
      },
      time: {
        mini: "5 minuti",
        trivial: "10 minuti",
        easy: "15 minuti",
        pro: "30 minuti",
      },
      assemble: ({ experienceFrag, claritySuffix, toolsFrag, timeFrag }) =>
        `Sei ${experienceFrag}, ${claritySuffix}, ${toolsFrag}, e puoi darmi ${timeFrag} al giorno.`,
    },
  },
  step11: {
    sparkIntro:
      "Sulla base di quello che mi hai detto, ti faccio tre promesse. Concrete.",
    loading: "Un attimo, sto cucendo le tue promesse...",
    promiseLabel: (n) => `Promessa ${n}`,
    cta: "Pronto, cominciamo →",
    fallbackPromises: DEFAULT_FALLBACK_IT,
  },
  step12: {
    sparkLine1: (name) => `Adesso comincia il viaggio vero, ${name}.`,
    sparkLine2:
      "Lezione uno. Si chiama “L'AI esegue, tu dirigi”. Dieci minuti, tutto qui.",
    cta: "Inizia la Lezione 1 →",
  },
  validationErrors: {
    nameRequired: "Mi serve un nome per andare avanti.",
    motivationRequired: "Questa è la domanda più importante. Dimmi qualcosa.",
  },
};

const en: ProfilingCopy = {
  meta: {
    title: "Let's begin",
    description:
      "Five minutes. Spark will ask a few questions to figure out who's in front of her.",
  },
  shell: {
    progressLabel: (current, total) => `${current} of ${total}`,
    backLabel: "Back",
    continueCta: "Continue →",
    submitting: "One moment...",
    genericError:
      "Something didn't work. Not your fault. Try again in a moment.",
    sparkLabel: "Spark, your learning companion",
  },
  step1: {
    languageHeading: "Pick your language",
    italian: "🇮🇹 Italiano",
    english: "🇬🇧 English",
    sparkLines: [
      "Hi. My name is Spark.",
      "I'll ask you a few questions over the next few minutes. I need to understand who's in front of me, because I don't teach everyone the same way.",
      "Five minutes, no more. Ready?",
    ],
    cta: "Let's start →",
  },
  step2: {
    sparkIntro: "Let's start with the simplest thing. What's your name?",
    sparkSub: "Just the name — that's all I need.",
    inputLabel: "Name",
    placeholder: "e.g. Marco",
    sparkMicro:
      "I'm Spark. “Spark,” as in a tiny flash of light. Stefano says it suits me.",
    errors: {
      empty: "I need a name. Even a made-up one, if you prefer.",
      tooShort: "At least two letters.",
      tooLong: "Maximum 30 characters.",
      invalidChars: "Use only letters, numbers, spaces and hyphens.",
    },
  },
  step3: {
    sparkIntro: (name) => `Good, ${name}. Now let's talk about you.`,
    sparkQuestion:
      "How far have you gotten with this whole building-with-AI thing?",
    options: [
      { key: "beginner", emoji: "🌱", label: "Never tried. I'm here to start from zero." },
      { key: "tried_failed", emoji: "🔧", label: "I've tried, but I keep getting stuck." },
      { key: "working_on_it", emoji: "⚡", label: "I'm already at it. I want a better method." },
      { key: "advanced", emoji: "🚀", label: "Advanced. I'm looking for serious structure." },
    ],
  },
  step4: {
    sparkIntro:
      "Ok. Now an important one: do you already have an idea of what you want to build?",
    options: [
      { key: "precise", emoji: "✨", label: "Yes, I have a clear idea." },
      { key: "vague", emoji: "💭", label: "Vaguely. I have intuitions but it isn't crisp." },
      { key: "exploring", emoji: "🌍", label: "Not yet. I'm exploring." },
    ],
    exploringCommentary:
      "Ok. That's more common than you'd think. Even if you don't know WHAT to build, I'll show you HOW, and the paths available. Promptly works for explorers too.",
  },
  step5: {
    sparkPrecise: "Good. Tell me in a few words. What do you want to build?",
    sparkVague:
      "That's fine too. Tell me what you have in mind, even if it's blurry. It doesn't need to be clear.",
    placeholderPrecise:
      "e.g. a site for my flower shop, an app to track my workouts...",
    placeholderVague:
      "e.g. something in the fitness space, a tool for my agency, I'm not sure...",
    sparkMicro:
      "Keep what you wrote in mind. I'll bring it back later, maybe when you least expect it.",
    errors: {
      tooShort: "Tell me a bit more. Two lines is fine.",
      tooLong: "Maximum 300 characters.",
    },
  },
  step6: {
    sparkIntro:
      "Quick map. Which AIs or tools have you already used? Tap any you recognise. If you don't recognise any, no problem — keep going.",
    llmHeading: "AI chatbots",
    ideHeading: "Editors & build tools",
    optionOther: "I've used something else not listed",
    optionNone: "I've never used any of these",
    otherPlaceholder: "Which one? (optional)",
  },
  step7: {
    sparkIntro:
      "Ok, I see you've already touched a few. Of the ones you picked, which felt the most yours? The one you got along with.",
    optionNone: "None really won me over",
    sparkMicro:
      "I ask because I speak differently to a Cursor person than to a Lovable person. They're not the same.",
  },
  step8: {
    sparkIntro: "How much time can you give me each day? No wrong answer.",
    options: [
      { key: "mini", emoji: "✨", label: "5 min — when I have a quick moment" },
      { key: "trivial", emoji: "⏱️", label: "10 min — a quick break" },
      { key: "easy", emoji: "📘", label: "15 min — my daily appointment" },
      { key: "pro", emoji: "⚡", label: "30 min — I want to move fast" },
    ],
    sparkMicro: "I have my own pace too. Not always quick.",
  },
  step9: {
    sparkIntroLine1: "Last question. The most important one.",
    sparkIntroLine2:
      "What really brought you here? A frustration you can't shake, a dream you want to make real, an outside pressure... Tell me freely.",
    placeholder:
      "e.g. I've had an idea for 3 years and can't build it / I want to switch jobs / I'm curious how this actually works...",
    sparkMicro:
      "What you tell me here, I don't forget. I'll use it to pull you out of the moments when you want to quit.",
    errors: {
      tooShort: "Tell me a bit more. Two lines is enough.",
      tooLong: "Maximum 500 characters.",
    },
  },
  step10: {
    sparkIntro: (name) => `Good, ${name}. I've read it.`,
    sparkLead: "Let me play it back so I'm sure I got you right:",
    sparkConfirm: "Did I get it, or is there something I want to revisit?",
    confirmCta: "Got it right, keep going →",
    modifyCta: "I want to change something",
    motivationLead: "And underneath all this, there's",
    fragments: {
      experience: {
        beginner: "a beginner",
        tried_failed: "someone who's already tried and stalled",
        working_on_it: "someone already at work",
        advanced: "a veteran",
      },
      clarity: {
        precise: "you have a clear idea",
        vague: "you have an idea that's still forming",
        exploring: "you're still exploring",
      },
      claritySuffix: {
        precise: (project) => ` about “${project}”`,
        vague: (project) => ` about “${project}”`,
        exploring: "",
      },
      tools: {
        none: "you're starting without a tool",
        preferred: (toolName) => `you feel at home with ${toolName}`,
      },
      time: {
        mini: "5 minutes",
        trivial: "10 minutes",
        easy: "15 minutes",
        pro: "30 minutes",
      },
      assemble: ({ experienceFrag, claritySuffix, toolsFrag, timeFrag }) =>
        `You're ${experienceFrag}, ${claritySuffix}, ${toolsFrag}, and you can give me ${timeFrag} a day.`,
    },
  },
  step11: {
    sparkIntro:
      "Based on what you've told me, I'll make you three promises. Concrete ones.",
    loading: "One moment, I'm stitching your promises...",
    promiseLabel: (n) => `Promise ${n}`,
    cta: "Ready, let's begin →",
    fallbackPromises: DEFAULT_FALLBACK_EN,
  },
  step12: {
    sparkLine1: (name) => `Now the real journey starts, ${name}.`,
    sparkLine2:
      "Lesson one. It's called “The AI executes, you direct.” Ten minutes, that's all.",
    cta: "Start Lesson 1 →",
  },
  validationErrors: {
    nameRequired: "I need a name to keep going.",
    motivationRequired: "This is the most important question. Tell me something.",
  },
};

export function getProfilingCopy(lang: Lang): ProfilingCopy {
  return lang === "en" ? en : it;
}
