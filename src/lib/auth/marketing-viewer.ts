import { auth } from "@clerk/nextjs/server";
import { cache } from "react";

import { getRoleFromSessionClaims, type AppRole } from "@/lib/auth/roles";

export type MarketingViewer = {
  role: AppRole | null;
  userId: string | null;
};

/**
 * Resolve the public-site viewer once per server render. React's request-scoped
 * cache prevents a page, the shared header, and repeated CTA components from
 * performing duplicate Clerk lookups without sharing identity across requests.
 */
export const getMarketingViewer = cache(async (): Promise<MarketingViewer> => {
  const { sessionClaims, userId } = await auth();

  return {
    role: userId ? getRoleFromSessionClaims(sessionClaims) : null,
    userId,
  };
});
