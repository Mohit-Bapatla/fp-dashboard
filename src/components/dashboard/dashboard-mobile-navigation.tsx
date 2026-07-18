"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Menu, X } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";
import { useState } from "react";

import { BrandMark } from "@/components/shared/brand-mark";

type DashboardMobileNavigationProps = {
  workspaceBadge: ReactNode;
  workspaceDescription: string;
  workspaceLabel: string;
  children: ReactNode;
};

export function DashboardMobileNavigation({
  workspaceBadge,
  workspaceDescription,
  workspaceLabel,
  children,
}: DashboardMobileNavigationProps) {
  const [open, setOpen] = useState(false);

  function handleNavigationClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target;

    if (target instanceof Element && target.closest("a")) {
      setOpen(false);
    }
  }

  return (
    <Dialog.Root onOpenChange={setOpen} open={open}>
      <Dialog.Trigger
        aria-label="Open dashboard navigation"
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-brand-navy shadow-sm transition-colors hover:border-primary/25 hover:bg-blue-surface hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card md:hidden"
      >
        <Menu aria-hidden="true" className="size-5" />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-brand-navy/35 backdrop-blur-sm transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex justify-start p-2 sm:p-3">
          <Dialog.Popup className="flex h-full w-full max-w-[22rem] flex-col overflow-hidden rounded-[14px] border border-white/70 bg-card text-foreground shadow-2xl outline-none transition duration-200 data-[ending-style]:-translate-x-5 data-[ending-style]:opacity-0 data-[starting-style]:-translate-x-5 data-[starting-style]:opacity-0">
            <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-4">
              <BrandMark />
              <Dialog.Close
                aria-label="Close dashboard navigation"
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-brand-navy transition-colors hover:border-primary/25 hover:bg-blue-surface hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              >
                <X aria-hidden="true" className="size-5" />
              </Dialog.Close>
            </div>

            <div className="border-b border-border bg-blue-surface/70 px-4 py-4">
              <Dialog.Title className="text-base font-semibold text-brand-navy">
                {workspaceLabel} dashboard
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                {workspaceDescription}
              </Dialog.Description>
              <div className="mt-3">{workspaceBadge}</div>
            </div>

            <div
              className="flex-1 overflow-y-auto overscroll-contain px-3 py-4"
              onClick={handleNavigationClick}
            >
              {children}
            </div>

            <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
              Press Escape at any time to close this menu.
            </p>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
