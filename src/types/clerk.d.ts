import type { AppRole } from "@/lib/auth/roles";

declare global {
  interface CustomJwtSessionClaims {
    metadata?: {
      role?: AppRole;
    };
  }
}

export {};
