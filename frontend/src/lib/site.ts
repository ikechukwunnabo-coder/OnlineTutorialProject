export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Ben Digital Solution",
  shortName: "BDS",
  description:
    "Beginner-first programming tutorials that explain the why, not just the syntax. Learn web development, Python, and databases one careful chapter at a time.",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  locale: "en_US",
} as const;

export function absoluteUrl(path = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.url}${normalized}`;
}
