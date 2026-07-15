import { ChevronDown } from "lucide-react";

export type FaqItem = {
  question: string;
  answer: string;
};

export function FaqList({ items }: { items: readonly FaqItem[] }) {
  return (
    <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      {items.map((item) => (
        <details
          className="group p-5 open:bg-blue-surface/45 sm:p-6"
          key={item.question}
        >
          <summary className="flex min-h-7 list-none items-center justify-between gap-5 text-left text-base font-semibold text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
            {item.question}
            <ChevronDown
              aria-hidden="true"
              className="size-5 shrink-0 text-primary transition-transform duration-200 group-open:rotate-180"
            />
          </summary>
          <p className="mt-4 max-w-3xl pr-8 text-sm leading-6 text-muted-foreground">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
