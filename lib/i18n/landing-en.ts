import type { LandingCopy } from "./landing";

export const landingCopyEn: LandingCopy = {
  meta: {
    title: "Vibe Coding Course: Build Apps with AI · Promptly",
    description:
      "Learn vibe coding with Promptly: talk to AI and build real apps without writing code. 14 free lessons, 5 minutes a day. Start free, no credit card.",
  },
  header: {
    login: "Log in",
    cta: "Start free",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
  hero: {
    eyebrow: "VIBE CODING · LEARN TO BUILD WITH AI",
    headline: "Turn your ideas into real apps.\nWithout writing a single line of code.",
    sub: "Promptly is the interactive vibe coding course: learn to talk to AI to build real software. Short lessons, hands-on exercises, results you see growing every day.",
    ctaPrimary: "Start free",
    ctaSecondary: "Try an example",
    ctaBug: "fix the bug",
    reminder: "14 free lessons · No credit card · 5 minutes a day",
    mockup: {
      url: "learnpromptly.app/lesson/1",
      lessonTitle: "What is vibe coding?",
      lessonStep: "Lesson 1 · Exercise",
      promptLabel: "Complete the definition",
      promptText: "Vibe coding is the practice of building ___ using ___ instead of writing code manually.",
      blank1: "software",
      blank2: "natural language",
      check: "Check answer",
      correct: "Correct! ✓",
      xpToast: "+150 XP ⚡",
    },
  },
  problem: {
    eyebrow: "Sound familiar?",
    title: "The infinite\nbug loop of vibe coding.",
    sub: "The story of trying to build with AI without knowing how to guide it.",
    steps: [
      {
        iconSlug: "idea",
        title: "You have a brilliant idea.",
        description:
          "AI feels like the perfect way to turn it into a real app. You start vibe coding, full of energy.",
      },
      {
        iconSlug: "wrench",
        title: "Something breaks.",
        description:
          "You write a prompt for the AI to fix the bug. It seems to work. You let out a sigh of relief and move on.",
      },
      {
        iconSlug: "loop",
        kickerEyebrow: "Three hours later, ten prompts later",
        title: "Now something else has broken.",
        description: "Then another piece. And another. You're back to square one.",
        kickerEnd: "Or worse.",
      },
    ],
    conclusion: {
      line1: "It's not your fault. No one taught you how to guide AI.",
      microExpertise: "It's problem #1 for anyone starting vibe coding without a method.",
      bridge: "But it can be learned.",
    },
  },
  solution: {
    title: "Promptly teaches you to build with words.",
    steps: [
      {
        number: "01",
        eyebrow: "LEARN",
        iconSlug: "mindset",
        title: "Understand how to talk to AI",
        sub: "Every concept in 5 minutes. No abstract theory — only what you'll actually use.",
      },
      {
        number: "02",
        eyebrow: "PRACTICE",
        iconSlug: "prompt",
        title: "Exercise with real prompts",
        sub: "Interactive exercises that correct you. Mistakes are welcome — they're how you'll learn fastest.",
      },
      {
        number: "03",
        eyebrow: "BUILD",
        iconSlug: "build",
        title: "Ship your first project",
        sub: "From the first line to a live deploy. By the end of the course you'll have a real app, online, working. And you'll know how to start the next one.",
      },
    ],
  },
  curriculum: {
    title: "The full path, in 5 steps.",
    sub: "38 lessons total. Start today with the first 14 free.",
    cards: [
      {
        number: "Path 1",
        iconSlug: "mindset",
        level: "beginner",
        title: "The Mindset",
        meta: "6 lessons · 30–50 min",
        tier: "free",
        tierLabel: "Free",
        startHere: "Start here",
      },
      {
        number: "Path 2",
        iconSlug: "prompt",
        level: "beginner",
        title: "The Prompt",
        meta: "8 lessons · 50–90 min",
        tier: "free",
        tierLabel: "Free",
      },
      {
        number: "Path 3",
        iconSlug: "build",
        level: "intermediate",
        title: "Build",
        meta: "10 lessons · 90–150 min",
        tier: "pro",
        tierLabel: "Pro",
      },
      {
        number: "Path 4",
        iconSlug: "debug",
        level: "advanced",
        title: "Debug",
        meta: "6 lessons · 50–80 min",
        tier: "pro",
        tierLabel: "Pro",
      },
      {
        number: "Path 5",
        iconSlug: "ship",
        level: "advanced",
        title: "Ship",
        meta: "8 lessons · 70–110 min",
        tier: "pro",
        tierLabel: "Pro",
      },
    ],
  },
  exercise: {
    title: "Try a lesson, now.",
    sub: "A real mini-lesson. No login required.",
    url: "learnpromptly.app/lesson/1",
    lessonStep: "Lesson 1 · Interactive exercise",
    lessonTitle: "What is vibe coding?",
    promptLabel: "Complete the definition",
    promptText:
      "Vibe coding is the practice of building ___ using ___ instead of writing code manually.",
    blanks: [
      {
        accepted: ["software", "applications", "apps", "real software", "programs"],
        hints: [
          "What would you build when you have an idea?",
          "Think about what opens when you tap an icon on your phone — what's it called?",
          "software",
        ],
      },
      {
        accepted: [
          "natural language",
          "words",
          "sentences",
          "prompts",
          "plain words",
          "plain english",
        ],
        hints: [
          "How are you reading this sentence right now?",
          "When you explain an idea to a friend, how do you do it?",
          "natural language",
        ],
      },
    ],
    microcopy: {
      verify: "Check",
      hint: "Hint",
      hintLabel: "Hint",
      revealLabel: "Answer",
      blankLabel: "Blank",
      attemptOf: "Attempt {n} of 3",
      wrongInline: "Almost — try again, or ask for a hint.",
      revealedNotice: "We filled in the blanks for you. Press Check to continue.",
      completedTitle: "Nice! You just did vibe coding.",
      completedSub: "Keep going with 13 more free lessons. They're waiting.",
      completedCta: "Sign up free",
      ariaInputBlank: "Blank {n}",
      ariaFeedback: "Exercise status",
    },
  },
  demo: {
    badge: "PROMPTLY · LIVE DEMO",
    title: "How effective is",
    titleEm: "your prompt?",
    subtitle:
      "You just created your website's homepage. It looks perfect, but something's off. What do you write to AI to ask for help?",
    homepage: {
      addressBar: "mealgenius.app",
      appName: "MEALGENIUS",
      nav: {
        howItWorks: "How it works",
        pricing: "Pricing",
        getStarted: "Get started",
      },
      luciaHeadline: "Hi, I'm Lucia.",
      luciaSubheadline:
        "I work in marketing and I'm building Mealgenius, the app that suggests what to cook based on what's in your fridge.",
      photoLabel: "profile photo",
      errorBadge: "404",
      projectTitle:
        "Mealgenius — the app that turns what you have in your fridge into the perfect dinner in 3 minutes",
      ctaButton: "DOWNLOAD",
      footer: "© 2026 MEALGENIUS — Made by Lucia",
      ariaIllustration: "Stylized illustration of Lucia",
      ariaHeaderIllustration: "Cartoon illustration: cooking with fresh food",
    },
    console: {
      errorLine1: "GET /assets/profilo.jpg 404 (Not Found)",
      errorLine2:
        "Failed to load resource: the server responded with a status of 404 (Not Found)",
    },
    editor: {
      windowTitle: "Code editor — prompt.md",
      placeholder:
        "Write here how you'd ask AI for help...\n\nHint: the AI can't see the homepage.\nYou have to describe what's not working.",
      statusReady: "ready",
      statusEvaluating: "evaluating",
      statusEvaluated: "evaluated",
      charsLabel: "characters",
      btnEvaluate: "evaluate prompt",
      btnEvaluating: "evaluating...",
      btnRetry: "retry",
      previousAttempt: "previous attempt: {score}/100",
      ariaTextarea: "Write your prompt here",
      ariaScore: "Total prompt score",
      ariaBar: "Dimension score",
    },
    result: {
      evalLabel: "RESULT",
      adviceLabel: "ADVICE",
      scoreLabels: {
        review: "NEEDS REWORK",
        improve: "NEEDS WORK",
        good: "GOOD",
        great: "GREAT",
        perfect: "PERFECT",
      },
      dimensions: {
        chiarezza: { label: "clarity", desc: "exact error" },
        contesto: { label: "context", desc: "environment / code" },
        obiettivo: { label: "goal", desc: "what you want" },
        protezione: { label: "guardrails", desc: "constraints" },
      },
    },
    messages: {
      scoreLow: "AI didn't quite get it. Improve your prompt and try again.",
      scoreMidOnePhotoOnly:
        "Good prompt. You fixed one bug, but something's still off.",
      scoreMidPartialOneLeft:
        "Almost! You caught the ones you mentioned. One left…",
      scoreMidAllBugs:
        "Nice! You caught all the bugs. To reach a perfect prompt, work on the details from the advice.",
      scoreHighPartial:
        "Great prompt — but did you notice the other {count} visible issues?",
      scoreHighAllTitle: "You fixed the homepage with a {score}/100 prompt.",
      scoreHighAllSub:
        "In Promptly you learn to do this for real, on your own projects.",
      ctaFinal: "Try it free →",
      limitTitle: "You've explored the demo well!",
      limitSub:
        "To keep learning and improving your prompts, start the journey in Promptly.",
      limitCta: "Start free →",
    },
    errors: {
      network: "Connection lost. Please try again in a few seconds.",
      rateLimit:
        "You've hit the evaluation limit. Try again in a few minutes.",
      tooLong: "Prompt is too long. 1500 characters max.",
      invalidPrompt: "We can't evaluate this prompt. Try rewriting it.",
      generic: "Something went wrong. Please try again.",
      empty: "Write something before evaluating.",
    },
    disclosure: {
      text:
        "The prompt you submit is processed by an AI (OpenAI, US) to generate the evaluation. Don't include personal data.",
      linkLabel: "Privacy Policy",
    },
    footer:
      "A small taste of Promptly — the app that teaches you real vibe coding.",
  },
  socialProof: {
    eyebrow: "COMMUNITY",
    title: "A community starting today.",
    sub: "We're gathering the first stories. Want to be one of them?",
    counter: "Among the first students of the program",
    placeholder: "Real student stories coming soon",
  },
  faq: {
    title: "Frequently asked questions.",
    sub: "Everything you want to know before starting.",
    items: [
      {
        q: "What is vibe coding and how does it work?",
        a: "Vibe coding means building software by talking to an AI in plain English instead of writing code line by line. You describe what you want — an app, a website, a small tool — and the AI builds it with you. It's the fastest way today to turn an idea into something real, even if you've never coded before.",
      },
      {
        q: "Can I learn vibe coding without knowing how to code?",
        a: "Yes — that's actually the whole point. Promptly is built for absolute beginners: if you can write a clear message, you already know about 70% of what's needed to vibe code. Nothing to install, no jargon required, just learning how to think and how to talk to AI.",
      },
      {
        q: "How much does the Promptly vibe coding course cost?",
        a: "The first 14 vibe coding lessons are free forever, no credit card required. The full path (38 lessons, advanced exercises, final live project) is on the Pro plan, which you only activate if you want to keep going. No hidden trial, no surprise renewal.",
      },
      {
        q: "How long does it take to learn vibe coding?",
        a: "Just 5 minutes a day: at that pace you finish all 38 lessons in about 6 weeks. If you want to go faster you can do several in a row — you set the rhythm, and the app keeps track of your progress so you don't lose momentum.",
      },
      {
        q: "What do I need to start building apps with AI?",
        a: "A browser and 5 free minutes: nothing to install, no credit card, no signing up across a dozen platforms. Open Promptly, pick the first vibe coding lesson, and start talking to an AI to build something of your own right away.",
      },
      {
        q: "Does vibe coding really work for non-technical people?",
        a: "Yes — non-technical people are exactly who Promptly is built for. The course assumes zero prior knowledge of code or terminals: it starts from the mindset, teaches you to ask the right questions of an AI, and walks you step by step toward shipping a real app.",
      },
      {
        q: "Which AI is used for vibe coding (Claude, ChatGPT)?",
        a: "We work mainly with Claude (Anthropic) and ChatGPT (OpenAI), the two most widely used models for vibe coding. We teach the prompt engineering principles that hold for any AI: when the dominant model changes, you'll know how to adapt without starting over.",
      },
      {
        q: "Will I have a live, real app at the end of the course?",
        a: "Yes. The final stage of the path is called 'Ship to the World': you walk out with a real, live, working app that you built entirely through vibe coding — not a sandbox exercise locked inside the app, but a project you can share with a link.",
      },
      {
        q: "Can I cancel my Promptly Pro subscription anytime?",
        a: "Yes, in one click from your account settings. No penalty, no questions, no email chains trying to keep you. If Pro isn't for you, you turn it off and you still keep access to the 14 free vibe coding lessons.",
      },
      {
        q: "How are Promptly's vibe coding lessons structured?",
        a: "Every lesson is a 5-minute micro-story: a short explanation of the concept, an interactive exercise where you actually try it, and a result you see right away. No 30-minute videos, no multiple-choice quizzes — it's all hands-on, all aimed at building.",
      },
      {
        q: "Is there a community of vibe coders to learn with?",
        a: "Yes, there's a dedicated space for people taking Promptly: share the projects you're building, ask questions when the AI gets you stuck, see what other vibe coders are working on. Learning with others beats learning alone.",
      },
      {
        q: "Where should a complete beginner start with vibe coding?",
        a: "Start with the first lesson: 'The Mindset of the Vibe Coder'. It's designed for total beginners and gives you the right way of thinking for the rest of the course — before you ever touch an AI, you understand how to reason. From there the path takes you step by step to your first app.",
      },
    ],
  },
  closingCta: {
    title: "Ready to build your first app?",
    sub: "Start free. No card. No time wasted.",
    cta: "Start free",
    reminder: "14 lessons · 5 minutes a day · Start building today",
  },
  footer: {
    columns: {
      product: {
        heading: "Product",
        links: [
          { label: "How it works", href: "#solution" },
          { label: "Curriculum", href: "#curriculum" },
        ],
      },
      resources: {
        heading: "Resources",
        links: [
          { label: "FAQ", href: "#faq" },
          { label: "Curriculum", href: "#curriculum" },
          { label: "Help", href: "mailto:support@learnpromptly.app" },
          { label: "Contact", href: "mailto:hello@learnpromptly.app" },
        ],
      },
      legal: {
        heading: "Legal",
        links: [
          { label: "Privacy", href: "/en/privacy" },
          { label: "Terms", href: "/en/terms" },
          { label: "Cookie", href: "/en/cookie" },
        ],
      },
    },
    socialHeading: "Follow",
    rights: "© 2026 Promptly · All rights reserved",
    builtWith: "Built with ❤ in Italy",
  },
};
