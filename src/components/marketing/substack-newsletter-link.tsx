import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

import { SocialIcon } from "./social-icons";

const accessibleName = "Future Physicians newsletter on Substack";

export function SubstackNewsletterLink({ className }: { className?: string }) {
  return (
    <a
      aria-label={accessibleName}
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-brand-navy bg-brand-navy shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:bg-brand-navy/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      data-social-link="substack"
      href={siteConfig.links.newsletter}
      rel="noopener noreferrer"
      target="_blank"
      title={accessibleName}
    >
      <SocialIcon className="size-[22px]" platform="substack" />
    </a>
  );
}
