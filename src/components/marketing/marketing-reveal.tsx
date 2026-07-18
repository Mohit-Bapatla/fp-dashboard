"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";

type MarketingRevealProps = {
  children: ReactNode;
  className?: string;
  distance?: number;
  durationMs?: number;
  staggerMs?: number;
  threshold?: number;
};

export function MarketingReveal({
  children,
  className,
  distance = 12,
  durationMs = 340,
  staggerMs = 60,
  threshold = 0.12,
}: MarketingRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) {
      container.dataset.revealed = "true";
      return;
    }

    let observer: IntersectionObserver | undefined;
    let observationFrame: number | undefined;

    const reveal = () => {
      container.dataset.revealed = "true";
      observer?.disconnect();
    };

    const showImmediately = () => {
      if (!reducedMotion.matches) {
        return;
      }

      observer?.disconnect();
      if (observationFrame !== undefined) {
        window.cancelAnimationFrame(observationFrame);
      }
      container.dataset.revealed = "true";
    };

    reducedMotion.addEventListener("change", showImmediately);

    if (
      typeof (window as Window & { IntersectionObserver?: unknown })
        .IntersectionObserver !== "function"
    ) {
      observationFrame = requestAnimationFrame(reveal);
    } else {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            reveal();
          }
        },
        { threshold },
      );
      observationFrame = window.requestAnimationFrame(() => {
        observer?.observe(container);
      });
    }

    return () => {
      observer?.disconnect();
      reducedMotion.removeEventListener("change", showImmediately);
      if (observationFrame !== undefined) {
        window.cancelAnimationFrame(observationFrame);
      }
    };
  }, [threshold]);

  const revealStyles = {
    "--marketing-reveal-distance": `${distance}px`,
    "--marketing-reveal-duration": `${durationMs}ms`,
    "--marketing-reveal-stagger": `${staggerMs}ms`,
  } as CSSProperties;

  return (
    <div
      className={className}
      data-reveal="section"
      data-revealed="false"
      ref={containerRef}
      style={revealStyles}
    >
      {children}
    </div>
  );
}
