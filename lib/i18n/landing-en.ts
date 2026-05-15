import type { LandingCopy } from "./landing";

export const landingCopyEn: LandingCopy = {
  meta: {
    title: "Vibe Coding Course: Build Apps with AI",
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
    eyebrow: "interactive course · 14 free lessons · 5 min a day",
    headline: "Vibe coding,",
    headlineHighlight: "taught properly.",
    sub: "Promptly takes you from zero to a published app by talking to AI instead of writing code. Five minutes a day with Spark, your learning companion.",
    ctaPrimary: "Start free",
    ctaSecondary: "Try it now",
    reminder: "no card · works on mobile · results from lesson one",
    carousel: {
      ariaLabel: "Promptly on iPhone: seven app screens scrolling",
      slides: [
        "Promptly onboarding: Spark explains the term «IDE» in a glossary popup, step 5 of 14",
        "The learning map: the «Mindset» village biome with completed lessons and the robot avatar",
        "The learning map scrolled to the Endgame: «Your Prompt Library», still locked",
        "The learning map: the «Debug» workshop biome (Pro) with locked bonus paths on the sides",
        "The learning map: the «Prompt» forest biome, coming in June",
        "The Promptly dashboard: today's goal, Spark message, streak and total XP",
        "A Promptly lesson: the CLAUDE.md file editor with guided sections to fill in",
      ],
    },
  },
  method: {
    kicker: "THE METHOD",
    lead: "No videos to watch. No code to write. Just **the right way** to talk to AI.",
    paragraphs: [
      {
        bold: "Every lesson takes 5 minutes.",
        body: "Open Promptly, read a card, answer a question. Spark — your learning companion, not a ChatGPT wrapper — explains a principle and immediately puts you to work building your own example.",
        quiet: "Mistakes are welcome: after three tries it shows you the answer and explains why.",
      },
      {
        bold: "You don't learn an AI, you learn the method.",
        body: "The techniques you'll see work with Claude, ChatGPT, Cursor, Copilot — and with whichever model comes next. Promptly teaches you to think before you ask, give context, set constraints, recognize when AI is getting it wrong.",
        quiet: "It's how real developers actually use AI.",
      },
    ],
  },
  meetSpark: {
    kicker: "YOUR COMPANION",
    name: "Her name is Spark.",
    portraitCaption: "illustration to be commissioned",
    paragraphs: [
      "Promptly doesn't have a chatbot. It has **Spark** — a companion with her own voice rules, who explains a concept and puts you to work right away. She speaks in the first person, in plain language, and never says «brilliant» or «amazing».",
      "She walks with you through 38 lessons and reminds you of two when you've forgotten the first. When you get it wrong, she helps you understand **why**. When you have doubts, she gives an example. When you get it, she steps aside.",
    ],
    rules: [
      { kind: "yes", label: "warm but direct" },
      { kind: "yes", label: "speaks in first person" },
      { kind: "no",  label: "LinkedIn-motivational" },
      { kind: "no",  label: "decorative emoji" },
      { kind: "no",  label: "«amazing!»" },
    ],
  },
  curriculum: {
    kicker: "THE BOOK",
    title: "Five chapters. Thirty-eight lessons.",
    sub: "The first two paths (14 lessons) are free. They're enough to build the right mindset and your first real prompts. You unlock the other three when you need them.",
    cards: [
      {
        number: "Path 01",
        iconSlug: "mindset",
        level: "beginner",
        title: "The Mindset",
        desc: "The way to think before touching an AI. Context, constraints, how to recognize an error.",
        meta: "6 lessons · 30–50 min",
        tier: "free",
        tierLabel: "Free",
        startHere: "Start here",
      },
      {
        number: "Path 02",
        iconSlug: "prompt",
        level: "beginner",
        title: "The Prompt",
        desc: "Anatomy, structure, and the eight formulas you'll use every day to ask AI for what you need.",
        meta: "8 lessons · 50–90 min",
        tier: "free",
        tierLabel: "Free",
      },
      {
        number: "Path 03",
        iconSlug: "build",
        level: "intermediate",
        title: "Build",
        desc: "From the first conversation to the first working feature. Real workflows on real projects.",
        meta: "10 lessons · 90–150 min",
        tier: "pro",
        tierLabel: "Pro",
      },
      {
        number: "Path 04",
        iconSlug: "debug",
        level: "advanced",
        title: "Debug",
        desc: "When AI gets it wrong, you got it wrong. The four typical errors and how to get out in two prompts.",
        meta: "6 lessons · 50–80 min",
        tier: "pro",
        tierLabel: "Pro",
      },
      {
        number: "Path 05",
        iconSlug: "ship",
        level: "advanced",
        title: "Ship to the World",
        desc: "You walk out with an app online — a link to share, built entirely by you.",
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
      text: "Your prompt is processed by OpenAI (US). Don't include personal data.",
      linkLabel: "Privacy",
    },
    spark: {
      label: "Spark, your companion",
      intro: "Lucia needs a hand. You write the prompt — I'll watch.",
      thinking: "Reading. One second.",
      victory: "Bingo. Fixed. Now you know how to do it too.",
      low: "Not yet. There are three bugs — look again and try once more.",
      partial: "Close. Something's missing. Re-read the errors and rewrite.",
      partialPhotoOnly: "You spotted the photo. Good start. But there are two more problems on the site — a title that overflows and a button that's unreadable.",
      partialOneLeft: "Almost there. You found two bugs, one to go. Hint: there's an element that should be visible and isn't.",
      partialMidAllBugs: "You've got the eyes — all 3 bugs spotted. Add one small operational detail — like «don't add libraries» — and you cross the line.",
      partialHighIncomplete: "Strong prompt. But one bug slipped past you — take another look at the site, there's still something off.",
      editingAfterAttempt: "I'm here. When you have a new idea, write it down.",
      limit: "Enough for now. Sign up if you want to keep going with me.",
    },
    writeHereOverlay: {
      desktop: "Write your prompt here",
      mobile: "Write here",
    },
    footer:
      "A small taste of Promptly — the app that teaches you real vibe coding.",
  },
  tools: {
    kicker: "THE TOOLS",
    title: "Works with every tool you already know.",
    sub: "Promptly teaches **the method**. You choose which AI to apply it with — Cursor, Claude Code, Windsurf, Copilot, or web builders like Bolt and v0. When we add tool-specific lessons, you'll find them here.",
    cards: [
      {
        slug: "cursor",
        name: "Cursor",
        desc: "Anysphere's AI IDE, a VS Code fork. The de facto standard for daily vibe coding.",
        badge: "lessons coming",
        ariaLabel: "Cursor — dedicated lessons coming",
      },
      {
        slug: "claude-code",
        name: "Claude Code",
        desc: "Anthropic's agentic CLI. Lives in the terminal and integrates with any editor — Spark's favorite.",
        badge: "lessons coming",
        ariaLabel: "Claude Code — dedicated lessons coming",
      },
      {
        slug: "windsurf",
        name: "Windsurf",
        desc: "Codeium's AI IDE. Direct alternative to Cursor with more aggressive agentic flows.",
        badge: "lessons coming",
        ariaLabel: "Windsurf — dedicated lessons coming",
      },
      {
        slug: "copilot",
        name: "GitHub Copilot",
        desc: "The first, and still the most widespread. Lives inside VS Code, JetBrains, Visual Studio and terminal.",
        badge: "lessons coming",
        ariaLabel: "GitHub Copilot — dedicated lessons coming",
      },
      {
        slug: "bolt",
        name: "Bolt.new",
        desc: "Build apps from chat, in your browser, zero setup. By StackBlitz — perfect to start.",
        badge: "lessons coming",
        ariaLabel: "Bolt.new — dedicated lessons coming",
      },
      {
        slug: "v0",
        name: "v0 by Vercel",
        desc: "Generate React UI by talking in plain English. Specializes in beautiful interfaces from the first prompt.",
        badge: "lessons coming",
        ariaLabel: "v0 by Vercel — dedicated lessons coming",
      },
    ],
  },
  faq: {
    title: "What's left to ask.",
    sub: "",
    items: [
      {
        q: "Do I need to know how to code?",
        a: "No — that's actually the ideal use case. If you can write a clear message, you already know 70% of what's needed. Nothing to install, no jargon required — we teach you how to think and how to talk to AI.",
      },
      {
        q: "Is it really free?",
        a: "The first two paths (14 lessons) are free forever, no credit card. The next three paths are on Pro, but you only activate it if you want to keep going. No hidden trial, no surprise renewals.",
      },
      {
        q: "Which AI will I use during the course?",
        a: "Promptly teaches the principles that work with any AI: Claude, ChatGPT, Cursor, Copilot. The examples use Claude because today it's the best fit for real projects, but the ideas are universal.",
      },
      {
        q: "How much time does it take?",
        a: "Five minutes a day. At that pace you finish all 38 lessons in about six weeks. If you want to go faster, do several in a row — you decide the rhythm.",
      },
      {
        q: "Will I have a real app online at the end?",
        a: "Yes. The last path is called «Ship to the World»: you walk out with a real, live, working app, built entirely by you through vibe coding. Not a sandbox exercise locked inside the app, but a link you can share.",
      },
      {
        q: "Can I cancel Pro anytime?",
        a: "Yes, in one click from settings. No penalty, no questions, no email chains. If you turn off Pro, you keep access to the 14 free lessons.",
      },
    ],
  },
  closingCta: {
    title: "Let's start.\nPromptly is free until your first published project.",
    sub: "",
    cta: "Start now →",
    reminder: "no card · 5 minutes a day · 14 free lessons",
  },
  footer: {
    columns: {
      product: {
        heading: "Product",
        links: [
          { label: "How it works", href: "#method" },
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
    socialLinks: [
      { label: "X / Twitter", href: "https://x.com/promptly_app", platform: "twitter" },
      {
        label: "LinkedIn",
        href: "https://www.linkedin.com/company/learnpromptly",
        platform: "linkedin",
      },
      { label: "GitHub", href: "https://github.com/stefanopisani91", platform: "github" },
    ],
    rights: "© 2026 Promptly · All rights reserved",
    builtWith: "Built with ❤ in Italy",
  },
};
