import { notFound } from "next/navigation";
import { isLang, type Lang } from "@/types";
import { getLandingCopy } from "@/lib/i18n/landing";
import { HeroSection } from "@/components/marketing/HeroSection";
import { ProblemSection } from "@/components/marketing/ProblemSection";
import { SolutionSection } from "@/components/marketing/SolutionSection";
import { PromptEvaluatorSection } from "@/components/marketing/PromptEvaluatorSection";
import { CurriculumPreview } from "@/components/marketing/CurriculumPreview";
import { SocialProofSection } from "@/components/marketing/SocialProofSection";
import { FAQSection } from "@/components/marketing/FAQSection";
import { ClosingCTA } from "@/components/marketing/ClosingCTA";
import { JsonLdCourse } from "@/components/marketing/JsonLdCourse";
import { JsonLdFAQ } from "@/components/marketing/JsonLdFAQ";

export default function LandingPage({ params }: { params: { lang: string } }) {
  if (!isLang(params.lang)) notFound();
  const lang: Lang = params.lang;
  const copy = getLandingCopy(lang);

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
      <PromptEvaluatorSection copy={copy.evaluator} lang={lang} />
      <CurriculumPreview copy={copy.curriculum} />
      <SocialProofSection copy={copy.socialProof} />
      <FAQSection copy={copy.faq} />
      <ClosingCTA copy={copy.closingCta} lang={lang} />
    </>
  );
}
