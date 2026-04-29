import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { LANGS } from "@/types";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return LANGS.map((lang) => ({
    url: `${SITE_URL}/${lang}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 1,
    alternates: {
      languages: Object.fromEntries(
        LANGS.map((l) => [l, `${SITE_URL}/${l}`]),
      ),
    },
  }));
}
