import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        "surface-muted": "var(--surface-muted)",
        border: "var(--border)",

        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          light: "var(--primary-light)",
          deep: "var(--primary-deep)",
        },

        success: {
          DEFAULT: "var(--success)",
          light: "var(--success-light)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          light: "var(--warning-light)",
        },
        error: "var(--error)",

        "xp-gold": "var(--xp-gold)",
        "streak-fire": "var(--streak-fire)",
        "streak-freeze": "var(--streak-freeze)",

        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },

        prompt: {
          bg: "var(--prompt-bg)",
          text: "var(--prompt-text)",
          fill: "var(--prompt-fill)",
          "fill-done": "var(--prompt-fill-done)",
        },

        pro: {
          accent: "var(--pro-accent)",
          light: "var(--pro-light)",
        },

        // Tool view dialect — see PROMPTLY.md "Tool view" section.
        // Only valid inside editor/IDE/terminal scenes.
        tool: {
          bg: "var(--tool-bg)",
          "bg-elevated": "var(--tool-bg-elevated)",
          "bg-result": "var(--tool-bg-result)",
          "bg-chrome": "var(--tool-bg-chrome)",
          "bg-action": "var(--tool-bg-action)",
          "bg-card": "var(--tool-bg-card)",
          divider: "var(--tool-divider)",
          "divider-soft": "var(--tool-divider-soft)",
          text: "var(--tool-text)",
          "text-muted": "var(--tool-text-muted)",
          "text-subtle": "var(--tool-text-subtle)",
          "text-faint": "var(--tool-text-faint)",
          accent: "var(--tool-accent)",
          "accent-bright": "var(--tool-accent-bright)",
          "accent-victory": "var(--tool-accent-victory)",
          error: "var(--tool-error)",
        },

        // macOS chrome dots + the rare deep surface used by ProblemSection.
        macos: {
          red: "var(--macos-red)",
          yellow: "var(--macos-yellow)",
          green: "var(--macos-green)",
        },
        "surface-deep": "var(--surface-deep)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-jakarta)", "var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
