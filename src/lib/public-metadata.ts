import type { Metadata } from "next";

import { siteConfig } from "@/lib/site-config";

const socialImage = {
  alt: "Future Physicians — Build your path into healthcare",
  height: 909,
  url: "/og.png",
  width: 1731,
} as const;

type PublicMetadataInput = {
  description: string;
  path: `/${string}` | "/";
  socialTitle?: string;
  title: string;
};

/**
 * Builds a complete metadata object for a public route. Next.js shallowly
 * replaces nested metadata such as openGraph, so every page must include the
 * shared image and its own route-specific social fields together.
 */
export function createPublicMetadata({
  description,
  path,
  socialTitle,
  title,
}: PublicMetadataInput): Metadata {
  const resolvedSocialTitle = socialTitle ?? `${title} | ${siteConfig.name}`;

  return {
    alternates: { canonical: path },
    description,
    openGraph: {
      description,
      images: [socialImage],
      siteName: siteConfig.name,
      title: resolvedSocialTitle,
      type: "website",
      url: path,
    },
    title,
    twitter: {
      card: "summary_large_image",
      description,
      images: [socialImage.url],
      title: resolvedSocialTitle,
    },
  };
}
