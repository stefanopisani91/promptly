import { notFound } from "next/navigation";
import { isLang, type Lang } from "@/types";
import { getLandingCopy } from "@/lib/i18n/landing";
import { createClient } from "@/lib/supabase/server";
import { HeroSection } from "@/components/marketing/HeroSection";
import { ProblemSection } from "@/components/marketing/ProblemSection";
import { SolutionSection } from "@/components/marketing/SolutionSection";
import { LuciaDemoSection } from "@/components/marketing/lucia/LuciaDemoSection";
import { CurriculumPreview } from "@/components/marketing/CurriculumPreview";
import { SocialProofSection } from "@/components/marketing/SocialProofSection";
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
      <HeroSection copy={copy.hero} lang={lang} />
      <ProblemSection copy={copy.problem} />
      <SolutionSection copy={copy.solution} />
      <LuciaDemoSection copy={copy.demo} lang={lang} isLoggedIn={isLoggedIn} />
      <CurriculumPreview copy={copy.curriculum} />
      <SocialProofSection copy={copy.socialProof} />
      <FAQSection copy={copy.faq} />
      <ClosingCTA copy={copy.closingCta} lang={lang} />
    </>
  );
}
