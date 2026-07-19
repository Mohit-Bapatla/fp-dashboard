"use client";

import { Dialog } from "@base-ui/react/dialog";
import { ChevronDown, Menu, X } from "lucide-react";
import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { useState } from "react";

import { siteConfig } from "@/lib/site-config";

const navigation = [
  { href: "/opportunities", label: "Opportunities" },
  { href: "/events", label: "Events" },
  { href: "/students", label: "For Students" },
  { href: "/partners", label: "For Partners" },
  { href: "/chapters", label: "Chapters" },
  { href: "/about", label: "About" },
  { href: "/support", label: "Support Us" },
];

export function MobileNavigation({
  accountAction,
  signedIn,
}: {
  accountAction: ReactNode;
  signedIn: boolean;
}) {
  const [open, setOpen] = useState(false);

  function handleNavigationClick(event: MouseEvent<HTMLElement>) {
    const target = event.target;

    if (target instanceof Element && target.closest("a")) {
      setOpen(false);
    }
  }

  return (
    <Dialog.Root onOpenChange={setOpen} open={open}>
      <Dialog.Trigger
        aria-label="Open navigation menu"
        className="inline-flex size-11 items-center justify-center rounded-xl border border-border bg-white text-brand-navy shadow-sm transition hover:bg-blue-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:hidden"
      >
        <Menu aria-hidden="true" className="size-5" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-brand-navy/35 backdrop-blur-sm transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex min-h-0 justify-end pt-[max(0.5rem,env(safe-area-inset-top))] pr-[max(0.5rem,env(safe-area-inset-right))] pb-[max(0.5rem,env(safe-area-inset-bottom))] pl-[max(0.5rem,env(safe-area-inset-left))] sm:pt-[max(1rem,env(safe-area-inset-top))] sm:pr-[max(1rem,env(safe-area-inset-right))] sm:pb-[max(1rem,env(safe-area-inset-bottom))] sm:pl-[max(1rem,env(safe-area-inset-left))]">
          <Dialog.Popup className="flex h-full min-h-0 max-h-[100dvh] w-full max-w-sm flex-col rounded-2xl border border-white/70 bg-white p-4 text-brand-navy shadow-2xl transition duration-200 data-[ending-style]:translate-x-2 data-[ending-style]:opacity-0 data-[starting-style]:translate-x-2 data-[starting-style]:opacity-0 sm:p-5">
            <div className="flex items-center justify-between gap-4 border-b border-border pb-3 sm:pb-4">
              <div>
                <Dialog.Title className="text-base font-semibold">
                  Future Physicians
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                  Explore the platform
                </Dialog.Description>
              </div>
              <Dialog.Close
                aria-label="Close navigation menu"
                className="inline-flex size-11 items-center justify-center rounded-xl border border-border text-brand-navy transition hover:bg-blue-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X aria-hidden="true" className="size-5" />
              </Dialog.Close>
            </div>

            <nav
              aria-label="Mobile navigation"
              className="mt-4 min-h-0 flex-1 overflow-y-auto overscroll-contain sm:mt-5"
              onClick={handleNavigationClick}
            >
              <details className="group rounded-xl border border-border bg-background">
                <summary className="flex min-h-12 list-none items-center justify-between px-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                  Explore
                  <ChevronDown
                    aria-hidden="true"
                    className="size-4 transition-transform group-open:rotate-180"
                  />
                </summary>
                <div className="grid gap-1 border-t border-border p-2">
                  {navigation.slice(0, 2).map((item) => (
                    <Link
                      className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-white hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      href={item.href}
                      key={item.href}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </details>
              <div className="mt-2 grid gap-1">
                {navigation.slice(2).map((item) => (
                  <Link
                    className="flex min-h-12 items-center rounded-xl px-4 text-sm font-semibold text-brand-navy transition hover:bg-blue-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    href={item.href}
                    key={item.href}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2 border-t border-border pt-5">
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-3 text-sm font-semibold hover:bg-blue-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href="/faq"
                >
                  FAQ
                </Link>
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-3 text-sm font-semibold hover:bg-blue-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href="/contact"
                >
                  Contact
                </Link>
              </div>
            </nav>

            <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:mt-5 sm:pt-5">
              {!signedIn ? (
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold hover:bg-blue-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href="/sign-in"
                >
                  Sign In
                </Link>
              ) : null}
              {accountAction}
              <a
                className="text-center text-xs font-medium text-muted-foreground underline-offset-4 hover:underline"
                href={siteConfig.links.newsletter}
                rel="noopener noreferrer"
                target="_blank"
              >
                Get the FP newsletter ↗
              </a>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
