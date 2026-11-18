import type { MetadataRoute } from "next";

import { getAllTutorials, getCategories, getTutorial } from "@/lib/api/client";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 600;

const staticPaths = ["/", "/tutorials", "/categories", "/about", "/contact", "/privacy", "/terms"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, tutorials] = await Promise.all([
    getCategories().catch(() => []),
    getAllTutorials().catch(() => []),
  ]);

  const details = await Promise.all(
    tutorials.map((tutorial) => getTutorial(tutorial.slug).catch(() => null)),
  );

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: path === "/" ? "daily" : "monthly",
    priority: path === "/" ? 1 : 0.6,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: absoluteUrl(`/categories/${category.slug}`),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const tutorialEntries: MetadataRoute.Sitemap = details.flatMap((tutorial) => {
    if (!tutorial) {
      return [];
    }
    return [
      {
        url: absoluteUrl(`/tutorials/${tutorial.slug}`),
        lastModified: tutorial.updated_at,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      },
      ...tutorial.chapters.map((chapter) => ({
        url: absoluteUrl(`/tutorials/${tutorial.slug}/${chapter.slug}`),
        lastModified: tutorial.updated_at,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    ];
  });

  return [...staticEntries, ...categoryEntries, ...tutorialEntries];
}
