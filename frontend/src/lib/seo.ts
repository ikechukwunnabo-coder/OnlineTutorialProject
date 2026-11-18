import type { Metadata } from "next";

import type { ChapterDetail, TutorialDetail } from "./api/types";
import { absoluteUrl, siteConfig } from "./site";

interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
  type?: "website" | "article";
}

export function pageMetadata({
  title,
  description,
  path,
  noIndex = false,
  type = "website",
}: PageMetadataInput): Metadata {
  const fullTitle = title === siteConfig.name ? title : `${title} | ${siteConfig.name}`;

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: {
      title: fullTitle,
      description,
      url: absoluteUrl(path),
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      type,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
    robots: noIndex
      ? { index: false, follow: false, nocache: true }
      : { index: true, follow: true },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function courseJsonLd(tutorial: TutorialDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: tutorial.title,
    description: tutorial.summary,
    url: absoluteUrl(`/tutorials/${tutorial.slug}`),
    provider: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    educationalLevel: tutorial.difficulty,
    timeRequired: `PT${Math.max(1, tutorial.estimated_reading_time)}M`,
    datePublished: tutorial.published_at,
    dateModified: tutorial.updated_at,
  };
}

export function articleJsonLd(chapter: ChapterDetail, tutorial: TutorialDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: chapter.title,
    description: chapter.summary,
    url: absoluteUrl(`/tutorials/${tutorial.slug}/${chapter.slug}`),
    datePublished: chapter.published_at,
    dateModified: chapter.updated_at,
    author: {
      "@type": "Person",
      name: tutorial.author.display_name,
    },
    isPartOf: {
      "@type": "Course",
      name: tutorial.title,
      url: absoluteUrl(`/tutorials/${tutorial.slug}`),
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };
}
