"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";

export function DemoExitButton({
  className,
  compact = false,
}: {
  className: string;
  compact?: boolean;
}) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string>();

  async function exitDemo() {
    setIsPending(true);
    setError(undefined);
    const formData = new FormData();
    formData.set("intent", "exit");

    try {
      const response = await fetch("/demo/session", {
        body: formData,
        method: "POST",
      });
      if (!response.ok) throw new Error("Demo exit request failed");
      const result = (await response.json()) as { redirectTo?: string };
      window.location.assign(result.redirectTo || "/demo");
    } catch {
      setIsPending(false);
      setError("Could not exit the demo. Please try again.");
    }
  }

  return (
    <span className="inline-flex flex-col items-center gap-1">
      <button
        className={className}
        disabled={isPending}
        onClick={exitDemo}
        type="button"
      >
        {compact ? <LogOut aria-hidden="true" className="size-4" /> : null}
        {isPending ? "Exiting…" : "Exit Demo"}
      </button>
      {error ? (
        <span aria-live="assertive" className="text-xs font-medium text-error">
          {error}
        </span>
      ) : null}
    </span>
  );
}
