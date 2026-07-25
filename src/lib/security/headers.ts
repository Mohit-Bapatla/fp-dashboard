export function buildContentSecurityPolicy(nonce: string) {
  const developmentEval =
    process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self' https://*.accounts.dev https://*.clerk.accounts.dev https://*.clerk.com",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${developmentEval} https://*.accounts.dev https://*.clerk.accounts.dev https://*.clerk.com https://*.clerk.dev https://challenges.cloudflare.com https://va.vercel-scripts.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://clerk.futurephysicians.org https://*.accounts.dev https://*.clerk.accounts.dev https://*.clerk.com https://*.clerk.dev https://*.supabase.co wss://*.supabase.co https://*.ingest.sentry.io https://vitals.vercel-insights.com https://va.vercel-scripts.com",
    "frame-src 'self' https://*.accounts.dev https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com https://www.youtube-nocookie.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "media-src 'self' https:",
    "upgrade-insecure-requests",
  ].join("; ");
}

export const securityHeaders = [
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
  {
    key: "Permissions-Policy",
    value: "camera=(), geolocation=(), microphone=(), payment=()",
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
] as const;

export const privateDashboardHeaders = [
  {
    key: "Cache-Control",
    value: "private, no-cache, no-store, max-age=0, must-revalidate",
  },
] as const;
