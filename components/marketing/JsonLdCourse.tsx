import type { Lang } from "@/types";
import { SITE_URL } from "@/lib/site";

interface Props {
  lang: Lang;
  name: string;
  description: string;
}

/**
 * Schema.org Course markup for the Promptly landing.
 * Helps search engines surface the course in rich results.
 *
 * Reference: https://schema.org/Course
 */
export function JsonLdCourse({ lang, name, description }: Props) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Course",
    name,
    description,
    inLanguage: lang,
    url: `${SITE_URL}/${lang}`,
    provider: {
      "@type": "Organization",
      name: "Promptly",
      url: SITE_URL,
      logo: `${SITE_URL}/brand/logo-symbol.svg`,
    },
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      category: "Free",
      price: "0",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "Online",
      courseWorkload: "PT5M",
    },
    educationalLevel: "Beginner",
    teaches: [
      "Vibe coding",
      "Prompt engineering",
      "AI-assisted development",
      "Building software with natural language",
    ],
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
