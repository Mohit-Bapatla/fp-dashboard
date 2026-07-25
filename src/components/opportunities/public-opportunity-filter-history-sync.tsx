"use client";

import { useEffect, useRef } from "react";

export function PublicOpportunityFilterHistorySync({
  stateKey,
}: {
  stateKey: string;
}) {
  const markerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    markerRef.current?.closest("form")?.reset();
  }, [stateKey]);

  useEffect(() => {
    const restoreCanonicalValues = () => {
      markerRef.current?.closest("form")?.reset();
    };

    window.addEventListener("pageshow", restoreCanonicalValues);
    return () => {
      window.removeEventListener("pageshow", restoreCanonicalValues);
    };
  }, []);

  return <span aria-hidden="true" className="hidden" ref={markerRef} />;
}
