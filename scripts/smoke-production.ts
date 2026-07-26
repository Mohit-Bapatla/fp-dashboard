import { chromium, type Page, type Response } from "@playwright/test";

import {
  CANONICAL_PRODUCTION_ORIGIN,
  EXPECTED_HOMEPAGE_METRICS,
  FRAMEWORK_ERROR_TEXT,
  PRODUCTION_PUBLIC_ROUTES,
  redactSmokeDiagnostic,
  validateCanonicalProductionUrl,
  validateProductionSecurityHeaders,
} from "../src/lib/reliability/production-smoke-policy";

type CheckResult = {
  detail: string;
  name: string;
  passed: boolean;
};

const checks: CheckResult[] = [];

function record(name: string, passed: boolean, detail: string) {
  checks.push({ detail: redactSmokeDiagnostic(detail), name, passed });
}

function responseChainLength(response: Response) {
  let count = 0;
  let request = response.request().redirectedFrom();
  while (request) {
    count += 1;
    request = request.redirectedFrom();
  }
  return count;
}

async function checkNoFrameworkError(page: Page, route: string) {
  const body = await page.locator("body").innerText();
  const match = FRAMEWORK_ERROR_TEXT.find((text) => body.includes(text));
  record(
    `${route} framework boundary`,
    !match,
    match ? `found framework error text: ${match}` : "no framework error text",
  );
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    extraHTTPHeaders: {
      "user-agent": "Future-Physicians-Read-Only-Production-Smoke/1.0",
    },
  });
  const page = await context.newPage();
  const runtimeFailures: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      runtimeFailures.push(`console: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    runtimeFailures.push(`pageerror: ${error.name}`);
  });
  page.on("response", (response) => {
    if (
      new URL(response.url()).hostname === "www.futurephysicians.org" &&
      response.status() >= 500
    ) {
      runtimeFailures.push(`HTTP ${response.status()} from canonical host`);
    }
  });

  try {
    for (const route of PRODUCTION_PUBLIC_ROUTES) {
      const response = await page.goto(
        `${CANONICAL_PRODUCTION_ORIGIN}${route}`,
        {
          waitUntil: "domcontentloaded",
          timeout: 30_000,
        },
      );
      await page
        .waitForLoadState("networkidle", { timeout: 15_000 })
        .catch(() => {
          // Clerk and monitoring may keep connections open. DOM assertions below
          // are the authoritative readiness checks.
        });

      record(
        `${route} HTTP 200`,
        response?.status() === 200,
        response ? `HTTP ${response.status()}` : "navigation had no response",
      );
      record(
        `${route} canonical host`,
        validateCanonicalProductionUrl(page.url()).length === 0,
        validateCanonicalProductionUrl(page.url()).join("; ") ||
          "canonical www host",
      );
      record(
        `${route} redirect safety`,
        response ? responseChainLength(response) <= 3 : false,
        response
          ? `${responseChainLength(response)} redirect(s)`
          : "navigation had no response",
      );
      await checkNoFrameworkError(page, route);

      if (route === "/") {
        const headers = response?.headers() ?? {};
        const headerFailures = validateProductionSecurityHeaders(headers);
        record(
          "production security headers",
          headerFailures.length === 0,
          headerFailures.join("; ") ||
            "required headers and narrow CSP present",
        );

        const metricRegion = page.getByRole("region", {
          name: "Future Physicians organization metrics",
        });
        record(
          "homepage metric region",
          (await metricRegion.count()) === 1,
          `${await metricRegion.count()} matching region(s)`,
        );
        for (const [value, label] of EXPECTED_HOMEPAGE_METRICS) {
          const labelLocator = metricRegion.getByText(label, { exact: true });
          const labelCount = await labelLocator.count();
          const pairIsExact =
            labelCount === 1 &&
            (await labelLocator.first().locator("..").innerText()).includes(
              value,
            );
          record(
            `homepage metric ${value}`,
            pairIsExact,
            pairIsExact
              ? `${value} — ${label}`
              : `expected one exact ${value} — ${label} pair`,
          );
        }
        record(
          "homepage metric substitution",
          !(await metricRegion.innerText()).match(/verified opportunities/i),
          "organization metrics do not use an opportunity count",
        );
      }

      if (route === "/opportunities") {
        const opportunities = page
          .locator("#directory-results article")
          .filter({ hasText: "Verified listing" });
        const opportunityCount = await opportunities.count();
        record(
          "public opportunity directory",
          opportunityCount >= 1,
          `${opportunityCount} published verified listing(s) rendered`,
        );
      }

      if (route === "/sign-in" || route === "/sign-up") {
        const clerkRoot = page.locator(".cl-rootBox").first();
        const mounted = await clerkRoot
          .waitFor({ state: "visible", timeout: 15_000 })
          .then(() => true)
          .catch(() => false);
        record(
          `${route} Clerk mount`,
          mounted,
          mounted
            ? "Clerk root is visible"
            : "Clerk root did not become visible",
        );
      }
    }

    record(
      "browser runtime",
      runtimeFailures.length === 0,
      runtimeFailures.length === 0
        ? "no console errors, page errors, or canonical 5xx responses"
        : runtimeFailures.slice(0, 5).join("; "),
    );
  } finally {
    await context.close();
    await browser.close();
  }

  console.log("Future Physicians production smoke (read-only, canonical www)");
  for (const check of checks) {
    console.log(
      `${check.passed ? "PASS" : "FAIL"}  ${check.name}: ${check.detail}`,
    );
  }

  const failures = checks.filter((check) => !check.passed);
  console.log(
    `${checks.length - failures.length}/${checks.length} checks passed; ${failures.length} failed`,
  );
  if (failures.length > 0) process.exitCode = 1;
}

main().catch((error: unknown) => {
  const label = error instanceof Error ? error.name : "UnknownError";
  console.error(`Production smoke could not complete: ${label}`);
  process.exitCode = 1;
});
