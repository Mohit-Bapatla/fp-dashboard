import type { Metadata } from "next";
import type { ReactNode } from "react";

import { DemoStateProvider } from "@/components/demo/demo-state-provider";

export const metadata: Metadata = {
  description:
    "A private, synthetic walkthrough of the Future Physicians student and partner dashboards.",
  robots: {
    follow: false,
    index: false,
    nocache: true,
  },
  title: "Platform Demo",
};

export default function DemoLayout({ children }: { children: ReactNode }) {
  return <DemoStateProvider>{children}</DemoStateProvider>;
}
