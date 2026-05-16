// Resend wrapper. Server-only — must never import from a Client Component.
// Failures are surfaced to the caller; the onboarding flow logs and swallows
// them so a Resend outage never blocks the user.

import { render } from "@react-email/components";
import { Resend } from "resend";
import type { Lang } from "@/types";
import { SITE_URL } from "@/lib/site";
import { WelcomeEmailIt } from "./email-templates/welcome-it";
import { WelcomeEmailEn } from "./email-templates/welcome-en";

const FALLBACK_FROM = "Promptly <welcome@send.learnpromptly.app>";

let cachedClient: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!cachedClient) cachedClient = new Resend(key);
  return cachedClient;
}

function fromAddress(): string {
  const env = process.env.RESEND_FROM_EMAIL?.trim();
  if (!env) return FALLBACK_FROM;
  // If the value already contains a display name (`Foo <foo@bar>`), pass it
  // through. Otherwise wrap it in the canonical Promptly display name.
  return env.includes("<") ? env : `Promptly <${env}>`;
}

export interface SendWelcomeEmailInput {
  to: string;
  name: string;
  lang: Lang;
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  reason?: "no_api_key" | "send_failed";
  error?: unknown;
}

export async function sendWelcomeEmail({
  to,
  name,
  lang,
}: SendWelcomeEmailInput): Promise<SendEmailResult> {
  const resend = getResend();
  if (!resend) {
    return { ok: false, reason: "no_api_key" };
  }

  const ctaUrl = `${SITE_URL}/dashboard`;
  const subject =
    lang === "it"
      ? `Benvenuto in Promptly, ${name} 🧠`
      : `Welcome to Promptly, ${name} 🧠`;

  const Template = lang === "it" ? WelcomeEmailIt : WelcomeEmailEn;
  const element = Template({ name, ctaUrl });
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress(),
      to,
      replyTo: "stepcloud3@icloud.com",
      subject,
      html,
      text,
    });
    if (error) {
      return { ok: false, reason: "send_failed", error };
    }
    return { ok: true, id: data?.id };
  } catch (error) {
    return { ok: false, reason: "send_failed", error };
  }
}
