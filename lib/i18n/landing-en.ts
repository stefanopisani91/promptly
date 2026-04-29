import type { LandingCopy } from "./landing";

export const landingCopyEn: LandingCopy = {
  meta: {
    title: "Promptly — Learn to build with words, not code",
    description:
      "The first interactive vibe coding course. Turn your ideas into real apps without writing code. Start free with 14 lessons.",
  },
  header: {
    login: "Log in",
    cta: "Start free",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
  hero: {
    eyebrow: "LEARN TO BUILD WITH AI",
    headline: "Turn your ideas into real apps.\nWithout writing a single line of code.",
    sub: "Promptly teaches you how to talk to AI to build real software. Short lessons, hands-on exercises, results you see growing every day.",
    ctaPrimary: "Start free",
    ctaSecondary: "Try an example",
    reminder: "14 free lessons · No credit card · 5 minutes a day",
    mockup: {
      url: "promptly.app/lesson/1",
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
    title: "You have an idea, but code is blocking you.",
    subtitle: "Sound familiar?",
    cards: [
      { emoji: "📌", quote: "I want to build my idea, but I can't code." },
      {
        emoji: "🌪",
        quote: "I tried coding courses, but they're long and abstract.",
      },
      {
        emoji: "🤖",
        quote: "AI looks promising, but I don't know how to actually use it.",
      },
    ],
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
    url: "promptly.app/lesson/1",
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
        q: "What is vibe coding?",
        a: "It's the practice of building software by talking to AI in natural language, instead of writing code line by line. You describe what you want, the AI builds it.",
      },
      {
        q: "Do I need to know how to code?",
        a: "No. Promptly is built for people starting from zero. If you can write an email, you know enough to begin.",
      },
      {
        q: "How much does it cost?",
        a: "The first 14 lessons are free, forever. The full path is on the Pro plan, which you can activate after trying the free lessons.",
      },
      {
        q: "How long does the course take?",
        a: "5 minutes a day for about 6 weeks, if you go slow. Faster if you want — you set the pace.",
      },
      {
        q: "What do I need to start?",
        a: "A browser and 5 minutes. Nothing to install, no credit card.",
      },
      {
        q: "Does it really work for non-technical people?",
        a: "Yes — that's actually our main audience. The course is designed for people who've never opened a code editor.",
      },
      {
        q: "Which AI will I use in the lessons?",
        a: "We'll work with the most-used models (Claude, ChatGPT). We teach the principles, not a single tool.",
      },
      {
        q: "Will I have a real project by the end?",
        a: "Yes. The final path is 'Ship': you walk out with a real, live app that you built yourself.",
      },
      {
        q: "Can I cancel Pro anytime?",
        a: "Yes, one click from settings. No penalty, no questions.",
      },
      {
        q: "How are the lessons structured?",
        a: "Each lesson is a micro-story: a short explanation, an interactive exercise, a result you see immediately. No 30-minute videos.",
      },
      {
        q: "Is there a community?",
        a: "Yes, we have a space for people taking the course — to share projects, ask questions, see what others are building.",
      },
      {
        q: "Which lesson should I start from?",
        a: "With the first one — 'The Mindset'. It's designed for absolute beginners, and gives you the right way of thinking for the rest of the course.",
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
          { label: "Help", href: "mailto:support@promptly.app" },
          { label: "Contact", href: "mailto:hello@promptly.app" },
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
