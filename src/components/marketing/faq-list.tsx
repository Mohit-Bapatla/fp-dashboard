"use client";

import { Accordion } from "@base-ui/react/accordion";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export function FaqList({
  className,
  items,
}: {
  className?: string;
  items: readonly FaqItem[];
}) {
  return (
    <Accordion.Root
      className={cn(
        "divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white shadow-sm",
        className,
      )}
      multiple
    >
      {items.map((item) => (
        <Accordion.Item
          className="group px-5 transition-colors duration-[240ms] data-[open]:bg-blue-surface/45 sm:px-6"
          key={item.id}
          value={item.id}
        >
          <Accordion.Header>
            <Accordion.Trigger className="flex min-h-16 w-full items-center justify-between gap-5 rounded-md py-3 text-left text-base font-semibold text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <span>{item.question}</span>
              <ChevronDown
                aria-hidden="true"
                className="size-5 shrink-0 text-primary transition-transform duration-[240ms] ease-in-out group-data-[open]:rotate-180"
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className="h-[var(--accordion-panel-height)] overflow-hidden opacity-100 transition-[height,opacity] duration-[240ms] ease-out data-[ending-style]:h-0 data-[ending-style]:opacity-0 data-[ending-style]:ease-in-out data-[starting-style]:h-0 data-[starting-style]:opacity-0">
            <p className="max-w-3xl pb-5 pr-8 text-sm leading-6 text-muted-foreground sm:pb-6">
              {item.answer}
            </p>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
