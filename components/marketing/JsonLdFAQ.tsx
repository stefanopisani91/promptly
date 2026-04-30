import type { LandingCopy } from "@/lib/i18n/landing";

interface Props {
  items: LandingCopy["faq"]["items"];
}

/**
 * Schema.org FAQPage markup. Eligible for FAQ rich result in Google SERP.
 * Reference: https://developers.google.com/search/docs/appearance/structured-data/faqpage
 */
export function JsonLdFAQ({ items }: Props) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
