"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const navLinkClass =
  "inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-muted-foreground transition hover:bg-blue-surface hover:text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const exploreLinks = [
  {
    description: "Browse verified healthcare experiences.",
    href: "/opportunities",
    label: "Opportunities",
  },
  {
    description: "Join upcoming programs or watch recordings.",
    href: "/events",
    label: "Events",
  },
] as const;

export function DesktopExploreMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-controls="desktop-explore-links"
        aria-expanded={open}
        className={navLinkClass}
        onClick={() => setOpen((current) => !current)}
        ref={triggerRef}
        type="button"
      >
        Explore
        <ChevronDown
          aria-hidden="true"
          className={`ml-1 size-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`absolute left-0 top-full w-64 rounded-2xl border border-border bg-white p-2 shadow-xl shadow-brand-navy/10 ${open ? "visible translate-y-0 opacity-100" : "invisible translate-y-1 opacity-0"}`}
        id="desktop-explore-links"
      >
        {exploreLinks.map((item) => (
          <Link
            className="block rounded-xl p-3 hover:bg-blue-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            href={item.href}
            key={item.href}
            onClick={() => setOpen(false)}
          >
            <span className="block text-sm font-semibold text-brand-navy">
              {item.label}
            </span>
            <span className="mt-1 block text-xs leading-5 text-muted-foreground">
              {item.description}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
