// Provisional privacy policy page for the landing-page Lucia demo.
// Disclosure built around Art. 13 GDPR + Italian Garante guidance + EU AI Act
// Art. 50 + EU-US Data Privacy Framework (Decisione di adeguatezza
// 2023/1795). This is INTERIM copy — replace with the lawyer-vetted version
// before public launch (tracked in PROMPTLY.md, "Privacy backlog" section).
//
// The whole page is server-rendered. Copy lives inside this file (one-off
// page; no need to bloat the shared i18n bundle).

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Lang } from "@/types";

interface PrivacySection {
  heading: string;
  body: string[];
}

interface PrivacyCopy {
  eyebrow: string;
  title: string;
  intro: string;
  effectiveDate: string;
  sections: PrivacySection[];
  contact: { heading: string; body: string };
  disclaimer: string;
  back: string;
}

const PRIVACY_IT: PrivacyCopy = {
  eyebrow: "INFORMATIVA PRIVACY · VERSIONE PROVVISORIA",
  title: "Privacy Policy",
  intro:
    "Questa è una versione provvisoria dell'informativa, scritta per coprire la demo \"Quanto è efficace il tuo prompt?\" presente sulla landing page. La versione definitiva, redatta con il supporto di un legale, sarà online prima del lancio pubblico del servizio.",
  effectiveDate: "In vigore dal: 3 maggio 2026",
  sections: [
    {
      heading: "1. Cosa elaboriamo nella demo della landing",
      body: [
        "Quando scrivi un prompt nella demo della landing e clicchi \"valuta prompt\", il testo che hai inserito viene inviato al servizio di intelligenza artificiale di OpenAI LLC (modello gpt-4o-mini, server negli Stati Uniti). Il modello produce una valutazione strutturata (punteggio + suggerimento) che ti viene mostrata immediatamente.",
        "Non conserviamo il testo del prompt oltre la sessione del tuo browser. Non lo salviamo nei nostri database, non lo registriamo nei log applicativi e OpenAI ha confermato pubblicamente che i dati inviati tramite l'API non vengono utilizzati per addestrare i propri modelli (API Data Usage Policies, marzo 2023).",
      ],
    },
    {
      heading: "2. Base giuridica del trattamento",
      body: [
        "Il trattamento si fonda sul legittimo interesse di Promptly a fornirti la demo interattiva che hai attivato volontariamente cliccando \"valuta prompt\" (Art. 6, par. 1, lett. f del Regolamento UE 2016/679 — GDPR). Cliccare il pulsante non costituisce un consenso esplicito ai sensi dell'Art. 6, par. 1, lett. a: è semplicemente l'azione con cui richiedi il servizio.",
      ],
    },
    {
      heading: "3. Trasferimento dati extra-UE",
      body: [
        "OpenAI LLC ha sede negli Stati Uniti. Il trasferimento dei dati avviene sotto l'EU-US Data Privacy Framework, in base alla Decisione di adeguatezza della Commissione europea 2023/1795 del 10 luglio 2023. OpenAI LLC è iscritta al Data Privacy Framework List (verificabile su dataprivacyframework.gov).",
        "Questo significa che, dal punto di vista della Commissione europea, gli Stati Uniti garantiscono un livello di protezione dei dati personali sostanzialmente equivalente a quello dell'Unione europea per i destinatari certificati DPF.",
      ],
    },
    {
      heading: "4. Avvertenza importante: cosa NON inserire nel prompt",
      body: [
        "Per la tua sicurezza, NON includere nel prompt che invii:",
        "• dati personali tuoi o di altre persone (nome, cognome, email, numeri di telefono, indirizzi);\n• dati \"particolari\" ai sensi dell'Art. 9 GDPR (salute, opinioni politiche, religione, orientamento sessuale, dati biometrici);\n• credenziali, password, chiavi API, token;\n• segreti commerciali, codice proprietario, informazioni riservate;\n• informazioni che riguardano terze persone identificabili.",
        "Il tema della demo è la homepage immaginaria di Lucia: ti chiediamo di scrivere come chiederesti aiuto a un'IA per sistemare i bug visibili. Non c'è alcun motivo per inserire informazioni personali.",
      ],
    },
    {
      heading: "5. Sistema di intelligenza artificiale (AI Act)",
      body: [
        "Stai interagendo con un sistema di intelligenza artificiale (modello generativo di linguaggio gpt-4o-mini di OpenAI). Questa informazione ti viene fornita ai sensi dell'Art. 50 del Regolamento UE 2024/1689 (AI Act).",
        "Le valutazioni prodotte dal modello sono indicative e a scopo didattico: non sostituiscono il giudizio umano e potrebbero contenere errori o imprecisioni.",
      ],
    },
    {
      heading: "6. I tuoi diritti",
      body: [
        "Anche per un utilizzo anonimo della demo, ti spettano i diritti previsti dagli articoli 15-22 del GDPR: accesso, rettifica, cancellazione, limitazione del trattamento, opposizione, portabilità. Nel caso della demo, dato che non conserviamo il prompt, l'esercizio dei diritti di accesso e cancellazione è automaticamente soddisfatto al termine della sessione.",
        "Hai inoltre diritto di proporre reclamo all'Autorità Garante per la protezione dei dati personali (www.garanteprivacy.it) se ritieni che il trattamento dei tuoi dati violi il GDPR.",
      ],
    },
    {
      heading: "7. Età minima",
      body: [
        "La demo non è destinata a minori di 16 anni. Se hai meno di 16 anni, ti chiediamo di non utilizzarla senza il consenso di chi esercita la responsabilità genitoriale.",
      ],
    },
    {
      heading: "8. Cookie e dati tecnici",
      body: [
        "La demo utilizza il sessionStorage del browser per mantenere lo stato visivo della pagina dopo una valutazione completata con successo (la homepage \"riparata\"). Questi dati restano sul tuo dispositivo, non ci vengono inviati e si cancellano alla chiusura del tab.",
        "Per gli altri cookie del sito vedi la Cookie Policy (in fase di finalizzazione).",
      ],
    },
  ],
  contact: {
    heading: "Titolare del trattamento e contatti",
    body: "Promptly · privacy@learnpromptly.app · learnpromptly.app",
  },
  disclaimer:
    "Versione provvisoria, sarà sostituita dalla versione definitiva (verificata da un legale) prima del lancio pubblico del servizio.",
  back: "Torna alla landing",
};

const PRIVACY_EN: PrivacyCopy = {
  eyebrow: "PRIVACY NOTICE · PROVISIONAL VERSION",
  title: "Privacy Policy",
  intro:
    "This is a provisional version of our privacy notice, written to cover the \"How effective is your prompt?\" demo on our landing page. The final version, drafted with the support of a lawyer, will be live before the public launch of the service.",
  effectiveDate: "Effective from: 3 May 2026",
  sections: [
    {
      heading: "1. What we process in the landing-page demo",
      body: [
        "When you write a prompt in the landing-page demo and click \"evaluate prompt\", the text you entered is sent to OpenAI LLC's AI service (gpt-4o-mini model, US-based servers). The model produces a structured evaluation (score + advice) that is shown to you immediately.",
        "We do not retain the prompt text beyond your browser session. We do not store it in our databases, we do not record it in application logs, and OpenAI has publicly confirmed that data submitted through the API is not used to train its models (API Data Usage Policies, March 2023).",
      ],
    },
    {
      heading: "2. Lawful basis for processing",
      body: [
        "Processing is based on Promptly's legitimate interest in providing you with the interactive demo you voluntarily activated by clicking \"evaluate prompt\" (Article 6(1)(f) of Regulation (EU) 2016/679 — GDPR). Clicking the button does not constitute explicit consent under Article 6(1)(a): it is simply the action by which you request the service.",
      ],
    },
    {
      heading: "3. Transfer of data outside the EU",
      body: [
        "OpenAI LLC is based in the United States. The data transfer takes place under the EU-US Data Privacy Framework, pursuant to European Commission Adequacy Decision 2023/1795 of 10 July 2023. OpenAI LLC is listed on the Data Privacy Framework List (verifiable at dataprivacyframework.gov).",
        "This means that, in the European Commission's view, the United States provides a level of personal data protection substantially equivalent to that of the European Union for DPF-certified recipients.",
      ],
    },
    {
      heading: "4. Important warning: what NOT to include in your prompt",
      body: [
        "For your own safety, do NOT include in the prompt you submit:",
        "• personal data of yours or of other people (name, surname, email, phone numbers, addresses);\n• \"special\" data under Article 9 GDPR (health, political opinions, religion, sexual orientation, biometric data);\n• credentials, passwords, API keys, tokens;\n• trade secrets, proprietary code, confidential information;\n• information about identifiable third parties.",
        "The demo's subject is Lucia's imaginary homepage: we are asking you to write how you would ask an AI for help to fix visible bugs. There is no reason to include any personal information.",
      ],
    },
    {
      heading: "5. Artificial intelligence system (AI Act)",
      body: [
        "You are interacting with an artificial intelligence system (OpenAI's gpt-4o-mini generative language model). This information is provided to you pursuant to Article 50 of Regulation (EU) 2024/1689 (AI Act).",
        "The evaluations produced by the model are indicative and for educational purposes: they do not replace human judgement and may contain errors or inaccuracies.",
      ],
    },
    {
      heading: "6. Your rights",
      body: [
        "Even for anonymous use of the demo, you are entitled to the rights set out in Articles 15-22 GDPR: access, rectification, erasure, restriction of processing, objection, portability. In the case of the demo, since we do not retain the prompt, the exercise of access and erasure rights is automatically satisfied at the end of the session.",
        "You also have the right to lodge a complaint with the Italian Data Protection Authority (Garante per la protezione dei dati personali — www.garanteprivacy.it) if you believe that the processing of your data infringes the GDPR.",
      ],
    },
    {
      heading: "7. Minimum age",
      body: [
        "The demo is not intended for users under 16. If you are under 16, please do not use it without the consent of those exercising parental responsibility.",
      ],
    },
    {
      heading: "8. Cookies and technical data",
      body: [
        "The demo uses the browser's sessionStorage to keep the visual state of the page after a successfully completed evaluation (the \"repaired\" homepage). This data stays on your device, is not sent to us, and is cleared when you close the tab.",
        "For other cookies on the site, see the Cookie Policy (currently being finalized).",
      ],
    },
  ],
  contact: {
    heading: "Data controller and contact",
    body: "Promptly · privacy@learnpromptly.app · learnpromptly.app",
  },
  disclaimer:
    "Provisional version, will be replaced by the final version (lawyer-reviewed) before the public launch of the service.",
  back: "Back to landing",
};

interface Props {
  lang: Lang;
}

export function PrivacyPolicyProvisional({ lang }: Props) {
  const copy = lang === "it" ? PRIVACY_IT : PRIVACY_EN;

  return (
    <article className="bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-64 bg-gradient-to-b from-primary-light/40 via-transparent to-transparent"
      />
      <div className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <Link
          href={`/${lang}`}
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> {copy.back}
        </Link>

        <header className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {copy.eyebrow}
          </p>
          <h1 className="mt-3 font-heading text-3xl font-bold leading-tight text-text-primary text-balance sm:text-4xl">
            {copy.title}
          </h1>
          <p className="mt-1 text-sm text-text-muted">{copy.effectiveDate}</p>
          <p className="mt-5 text-base text-text-secondary sm:text-lg">
            {copy.intro}
          </p>
        </header>

        <div className="space-y-9">
          {copy.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-heading text-lg font-bold text-text-primary sm:text-xl">
                {section.heading}
              </h2>
              <div className="mt-3 space-y-3 text-base leading-relaxed text-text-secondary">
                {section.body.map((paragraph, i) => (
                  <p key={i} className="whitespace-pre-line">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}

          <section>
            <h2 className="font-heading text-lg font-bold text-text-primary sm:text-xl">
              {copy.contact.heading}
            </h2>
            <p className="mt-3 text-base text-text-secondary">
              {copy.contact.body}
            </p>
          </section>
        </div>

        <p className="mt-12 rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm italic text-text-muted">
          {copy.disclaimer}
        </p>
      </div>
    </article>
  );
}
