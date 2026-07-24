"use client";

import { useClerk } from "@clerk/nextjs";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { useState } from "react";

import { createDashboardSignOutController } from "@/lib/auth/dashboard-sign-out";

export function getAccountInitials(displayName: string) {
  const parts = displayName
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return "FP";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function DashboardAccountMenu({ displayName }: { displayName: string }) {
  const { signOut } = useClerk();
  const [error, setError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [controller] = useState(() =>
    createDashboardSignOutController(signOut),
  );

  const handleSignOut = () => {
    void controller.run({
      setError,
      setPending: setIsSigningOut,
    });
  };

  return (
    <details
      aria-busy={isSigningOut}
      className="group relative"
      data-sign-out-state={error ? "error" : isSigningOut ? "pending" : "idle"}
    >
      <summary
        aria-label="Open account menu"
        className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl border border-border bg-card px-2.5 text-brand-navy transition-colors hover:border-primary/25 hover:bg-blue-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card [&::-webkit-details-marker]:hidden"
        onClick={(event) => {
          if (isSigningOut) {
            event.preventDefault();
          }
        }}
      >
        <span className="grid size-7 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {getAccountInitials(displayName)}
        </span>
        <UserRound aria-hidden="true" className="hidden size-4 sm:block" />
        <ChevronDown
          aria-hidden="true"
          className="size-3.5 transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-border bg-card p-3 shadow-xl">
        <div className="border-b border-border px-2 pb-3">
          <p className="text-xs font-medium text-muted-foreground">Account</p>
          <p className="mt-1 truncate text-sm font-semibold text-brand-navy">
            {displayName}
          </p>
        </div>
        <button
          className="mt-2 flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-semibold text-brand-navy transition-colors hover:bg-blue-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-65"
          disabled={isSigningOut}
          onClick={handleSignOut}
          type="button"
        >
          <LogOut aria-hidden="true" className="size-4" />
          {isSigningOut ? "Signing out..." : "Sign out"}
        </button>
        {error ? (
          <p
            className="mt-2 rounded-lg bg-error/10 px-3 py-2 text-xs leading-5 text-error"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>
    </details>
  );
}
