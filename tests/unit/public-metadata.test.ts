import { describe, expect, it } from "vitest";

import { createPublicMetadata } from "@/lib/public-metadata";

describe("public route metadata", () => {
  it("keeps route-specific social fields and the shared image together", () => {
    const metadata = createPublicMetadata({
      description: "A route-specific description.",
      path: "/about",
      title: "About",
    });

    expect(metadata).toMatchObject({
      alternates: { canonical: "/about" },
      description: "A route-specific description.",
      openGraph: {
        description: "A route-specific description.",
        images: [
          {
            alt: "Future Physicians — Build your path into healthcare",
            height: 909,
            url: "/og.png",
            width: 1731,
          },
        ],
        title: "About | Future Physicians",
        type: "website",
        url: "/about",
      },
      title: "About",
      twitter: {
        card: "summary_large_image",
        description: "A route-specific description.",
        images: ["/og.png"],
        title: "About | Future Physicians",
      },
    });
  });
});
