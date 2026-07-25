import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SocialIcon } from "@/components/marketing/social-icons";
import { SubstackNewsletterLink } from "@/components/marketing/substack-newsletter-link";

describe("Substack newsletter mark", () => {
  it("uses the official unmodified Substack geometry and brand color", () => {
    const markup = renderToStaticMarkup(<SocialIcon platform="substack" />);

    expect(markup).toContain('viewBox="0 0 1000 1000"');
    expect(markup.match(/fill="#FF6719"/g)).toHaveLength(3);
    expect(markup).toContain(
      "M764.166 348.371H236.319V419.402H764.166V348.371Z",
    );
    expect(markup).toContain(
      "M236.319 483.752V813.999L500.231 666.512L764.19 813.999V483.752H236.319Z",
    );
    expect(markup).toContain("M764.166 213H236.319V284.019H764.166V213Z");
  });

  it("provides an exact accessible name and safe external-link attributes", () => {
    const markup = renderToStaticMarkup(<SubstackNewsletterLink />);

    expect(markup).toContain(
      'aria-label="Future Physicians newsletter on Substack"',
    );
    expect(markup).toContain('href="https://futurephysicians.substack.com/"');
    expect(markup).toContain('rel="noopener noreferrer"');
    expect(markup).toContain('target="_blank"');
  });
});
