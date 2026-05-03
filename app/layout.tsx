import type { Metadata, Viewport } from "next";
import {
  Inter,
  Plus_Jakarta_Sans,
  JetBrains_Mono,
  Fredoka,
} from "next/font/google";
import { headers } from "next/headers";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

type Lang = "en" | "it";

function isLang(value: unknown): value is Lang {
  return value === "en" || value === "it";
}

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["500", "600", "700"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

// Fredoka is used exclusively inside the landing-page Lucia demo for the
// fictional app's logo + decorative DOWNLOAD button. It deliberately doesn't
// match the Promptly heading font (Plus Jakarta Sans) so visitors read
// Lucia's site as a separate piece of content from the landing itself.
const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
  weight: ["600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Promptly — Learn to build with words, not code",
    template: "%s · Promptly",
  },
  description:
    "Promptly teaches you how to talk to AI to build real software. Short lessons, hands-on exercises, results you see growing every day.",
};

export const viewport: Viewport = {
  themeColor: "#E8703F",
  width: "device-width",
  initialScale: 1,
};

function langFromHeaders(): Lang {
  // Prefer Accept-Language header for the <html lang> attribute.
  // The actual route-bound language is set in the [lang] segment;
  // this is just for the root <html> in the rare case of pages outside [lang]
  // (root redirect, error pages). Defaults to 'it'.
  const acceptLanguage = headers().get("accept-language") ?? "";
  const lower = acceptLanguage.toLowerCase();
  if (lower.startsWith("en")) return "en";
  if (lower.startsWith("it")) return "it";
  // Fallback
  return isLang(lower.split("-")[0]) ? (lower.split("-")[0] as Lang) : "it";
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = langFromHeaders();
  return (
    <html
      lang={lang}
      className={`${inter.variable} ${jakarta.variable} ${jetbrains.variable} ${fredoka.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
