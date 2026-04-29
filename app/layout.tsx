import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import type { Lang } from "@/types";
import { isLang } from "@/types";

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

export const metadata: Metadata = {
  metadataBase: new URL("https://promptly.app"),
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
  const pathname = headers().get("x-pathname") ?? "/";
  const seg = pathname.split("/")[1];
  return isLang(seg) ? seg : "it";
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
      className={`${inter.variable} ${jakarta.variable} ${jetbrains.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
