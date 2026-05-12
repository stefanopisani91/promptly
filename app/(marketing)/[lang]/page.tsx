import { notFound } from "next/navigation";
import { isLang, type Lang } from "@/types";
import { getLandingCopy } from "@/lib/i18n/landing";
import { createClient } from "@/lib/supabase/server";
import { HeroSection } from "@/components/marketing/HeroSection";
import { MethodSection } from "@/components/marketing/MethodSection";
import { MeetSparkSection } from "@/components/marketing/MeetSparkSection";
import { LuciaDemoSection } from "@/components/marketing/lucia/LuciaDemoSection";
import { ToolsSection } from "@/components/marketing/ToolsSection";
import { CurriculumPreview } from "@/components/marketing/CurriculumPreview";
import { FAQSection } from "@/components/marketing/FAQSection";
import { ClosingCTA } from "@/components/marketing/ClosingCTA";
import { JsonLdCourse } from "@/components/marketing/JsonLdCourse";
import { JsonLdFAQ } from "@/components/marketing/JsonLdFAQ";

export default async function LandingPage({
  params,
}: {
  params: { lang: string };
}) {
  if (!isLang(params.lang)) notFound();
  const lang: Lang = params.lang;
  const copy = getLandingCopy(lang);

  // Resolve session state server-side so the Lucia demo can suppress
  // the onboarding "write here" overlay for already-logged users.
  // Session check is cookie-based and tolerant: if anything fails we
  // assume "not logged in" so a transient auth blip doesn't hide the
  // overlay for a real first-time visitor.
  let isLoggedIn = false;
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    isLoggedIn = !!data?.user;
  } catch {
    // ignore — leave isLoggedIn = false
  }

  return (
    <>
      <JsonLdCourse
        lang={lang}
        name={copy.meta.title}
        description={copy.meta.description}
      />
      <JsonLdFAQ items={copy.faq.items} />
      {/* Composizione landing editoriale (rev. May 2026):
          Hero (iPhone 3D + carosello) → Metodo → Meet Spark →
          Demo Lucia → Strumenti (6 IDE) → Curriculum → FAQ → Closing */}
      <HeroSection copy={copy.hero} lang={lang} />
      <MethodSection copy={copy.method} />
      <MeetSparkSection copy={copy.meetSpark} />
      <LuciaDemoSection copy={copy.demo} lang={lang} isLoggedIn={isLoggedIn} />
      <ToolsSection copy={copy.tools} />
      <CurriculumPreview copy={copy.curriculum} />
      <FAQSection copy={copy.faq} />
      <ClosingCTA copy={copy.closingCta} lang={lang} />
    </>
  );
}
