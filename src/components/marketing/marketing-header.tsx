import Link from "next/link";

import { BrandMark } from "@/components/shared/brand-mark";
import { getMarketingViewer } from "@/lib/auth/marketing-viewer";

import { DashboardEntryButton } from "./dashboard-entry-button";
import { DesktopExploreMenu } from "./desktop-explore-menu";
import { MobileNavigation } from "./mobile-navigation";

const primaryNavigation = [
  { href: "/students", label: "For Students" },
  { href: "/partners", label: "For Partners" },
  { href: "/chapters", label: "Chapters" },
  { href: "/about", label: "About" },
  { href: "/support", label: "Support Us" },
];

const navLinkClass =
  "inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-muted-foreground transition hover:bg-blue-surface hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export async function MarketingHeader() {
  const { userId } = await getMarketingViewer();
  const accountAction = <DashboardEntryButton className="w-full xl:w-auto" />;

  return (
    <header className="sticky top-0 z-40 border-b border-border/90 bg-white/95 backdrop-blur-xl supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex min-h-[calc(64px+env(safe-area-inset-top))] w-full max-w-[1280px] items-center justify-between gap-3 pt-[env(safe-area-inset-top)] pr-[max(1.25rem,env(safe-area-inset-right))] pl-[max(1.25rem,env(safe-area-inset-left))] sm:min-h-[calc(72px+env(safe-area-inset-top))] sm:gap-4 sm:pr-[max(2rem,env(safe-area-inset-right))] sm:pl-[max(2rem,env(safe-area-inset-left))]">
        <BrandMark />

        <nav
          aria-label="Primary navigation"
          className="hidden items-center xl:flex"
        >
          <DesktopExploreMenu />
          {primaryNavigation.map((item) => (
            <Link className={navLinkClass} href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 xl:flex">
          {!userId ? (
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-brand-navy transition hover:bg-blue-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href="/sign-in"
            >
              Sign In
            </Link>
          ) : null}
          {accountAction}
        </div>

        <MobileNavigation
          accountAction={accountAction}
          signedIn={Boolean(userId)}
        />
      </div>
    </header>
  );
}
