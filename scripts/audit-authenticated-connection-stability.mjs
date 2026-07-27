import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { performance } from "node:perf_hooks";

import { chromium } from "@playwright/test";

const args = new Map();

for (let index = 2; index < process.argv.length; index += 2) {
  const name = process.argv[index];
  const value = process.argv[index + 1];

  if (!name?.startsWith("--") || value === undefined) {
    throw new Error("Arguments must use --name value pairs.");
  }

  args.set(name, value);
}

const baseUrl = args.get("--base-url");
const outputPath = args.get("--output");
const mode = args.get("--mode") ?? "matrix";
const email = process.env.FP_LOAD_TEST_EMAIL;
const expectedSha = process.env.FP_LOAD_TEST_SHA;
const vercelShareUrl = process.env.FP_VERCEL_SHARE_URL;

if (!baseUrl || !outputPath || !email || !expectedSha || !vercelShareUrl) {
  throw new Error(
    "Required configuration is missing. Provide --base-url, --output, FP_LOAD_TEST_EMAIL, FP_LOAD_TEST_SHA, and FP_VERCEL_SHARE_URL.",
  );
}

const parsedBaseUrl = new URL(baseUrl);

if (
  parsedBaseUrl.protocol !== "https:" ||
  !parsedBaseUrl.hostname.endsWith(".vercel.app") ||
  !parsedBaseUrl.hostname.startsWith("fp-dashboard-")
) {
  throw new Error("The load target must be an exact HTTPS Vercel deployment.");
}

const parsedShareUrl = new URL(vercelShareUrl);

if (
  parsedShareUrl.origin !== parsedBaseUrl.origin ||
  !parsedShareUrl.searchParams.has("_vercel_share")
) {
  throw new Error(
    "FP_VERCEL_SHARE_URL must authorize the exact deployment origin.",
  );
}

if (mode !== "matrix" && mode !== "soak") {
  throw new Error("--mode must be matrix or soak.");
}

const routes = [
  "/dashboard/student",
  "/dashboard/student/opportunities",
  "/dashboard/student/saved",
  "/dashboard/student/applications",
  "/dashboard/student",
];

const percentile = (values, fraction) => {
  if (values.length === 0) return null;

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(
    sorted.length - 1,
    Math.ceil(sorted.length * fraction) - 1,
  );

  return Number(sorted[index].toFixed(1));
};

const summarizeNavigations = (navigations) => {
  const durations = navigations.map((navigation) => navigation.durationMs);
  const statusDistribution = {};

  for (const navigation of navigations) {
    const key = String(navigation.status ?? "navigation-error");
    statusDistribution[key] = (statusDistribution[key] ?? 0) + 1;
  }

  return {
    navigationCount: navigations.length,
    successfulNavigations: navigations.filter(
      (navigation) =>
        navigation.error === null &&
        navigation.status !== null &&
        navigation.status < 400 &&
        !navigation.dashboardUnavailable,
    ).length,
    failedNavigations: navigations.filter(
      (navigation) =>
        navigation.error !== null ||
        navigation.status === null ||
        navigation.status >= 400 ||
        navigation.dashboardUnavailable,
    ).length,
    statusDistribution,
    medianMs: percentile(durations, 0.5),
    p95Ms: percentile(durations, 0.95),
    maxMs:
      durations.length === 0 ? null : Number(Math.max(...durations).toFixed(1)),
  };
};

const isBrowserNavigationCancellation = (errorText) =>
  errorText === "net::ERR_ABORTED" ||
  errorText === "cancelled" ||
  errorText === "Load request cancelled";

const isAllowedRequestCancellation = (request) => {
  const errorText = request.failure()?.errorText ?? null;

  if (
    request.method() !== "GET" ||
    !isBrowserNavigationCancellation(errorText)
  ) {
    return false;
  }

  try {
    const url = new URL(request.url());

    // Keep this identical in spirit to tests/e2e/fixtures.ts: only a
    // same-origin GET fetch/xhr carrying Next's exact RSC marker may be
    // classified as an intentionally superseded prefetch.
    return (
      url.origin === parsedBaseUrl.origin &&
      url.searchParams.has("_rsc") &&
      ["fetch", "xhr"].includes(request.resourceType())
    );
  } catch {
    return false;
  }
};

const temporaryDirectory = await mkdtemp(
  join(tmpdir(), "fp-connection-stability-"),
);
const storageStatePath = join(temporaryDirectory, "auth-state.json");
const browser = await chromium.launch({ headless: true });
const startedAt = new Date().toISOString();

const results = {
  schemaVersion: 1,
  mode,
  target: {
    origin: parsedBaseUrl.origin,
    commitSha: expectedSha,
  },
  startedAt,
  finishedAt: null,
  matrix: [],
  soak: null,
  aggregate: null,
};

const authenticate = async () => {
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(vercelShareUrl, {
    waitUntil: "domcontentloaded",
  });
  await page.goto(`${parsedBaseUrl.origin}/sign-in`, {
    waitUntil: "domcontentloaded",
  });

  const emailInput = page.getByRole("textbox", { name: "Email address" });
  const continueButton = page.getByRole("button", {
    name: "Continue",
    exact: true,
  });
  await emailInput.waitFor({ state: "visible" });
  await emailInput.fill(email);
  await continueButton.click();

  const anotherMethodLink = page.getByRole("link", {
    name: "Use another method",
    exact: true,
  });
  await anotherMethodLink.waitFor({ state: "visible" });
  await anotherMethodLink.click();

  const emailCodeButton = page.getByRole("button", {
    name: `Email code to ${email}`,
    exact: true,
  });
  await emailCodeButton.waitFor({ state: "visible" });
  await emailCodeButton.click();

  const verificationCodeInput = page.getByRole("textbox", {
    name: "Enter verification code",
  });
  await verificationCodeInput.waitFor({ state: "visible" });
  // Clerk renders the OTP field before its send-code request is fully ready.
  // A short bounded pause prevents racing verification against that request.
  await page.waitForTimeout(1_000);
  await verificationCodeInput.pressSequentially("424242");

  if (await continueButton.isVisible().catch(() => false)) {
    await continueButton.click().catch((error) => {
      if (new URL(page.url()).pathname !== "/dashboard/student") {
        throw error;
      }
    });
  }

  await page.waitForURL(
    (url) =>
      url.origin === parsedBaseUrl.origin &&
      url.pathname === "/dashboard/student",
    { timeout: 45_000 },
  );

  await context.storageState({ path: storageStatePath });
  await context.close();
};

const createTestPage = async () => {
  const context = await browser.newContext({
    storageState: storageStatePath,
  });
  const page = await context.newPage();
  let monitoring = true;
  const allowedRequestCancellations = [];
  const consoleErrors = [];
  const httpFailures = [];
  const pageErrors = [];
  const requestActivity = {
    events: [],
    firstPartyPostStarted: 0,
    pendingFirstPartyPosts: new Set(),
  };
  const requestFailures = [];

  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      new URL(request.url()).origin === parsedBaseUrl.origin
    ) {
      requestActivity.firstPartyPostStarted += 1;
      requestActivity.pendingFirstPartyPosts.add(request);
      requestActivity.events.push({
        event: "started",
        pageRoute: new URL(page.url()).pathname,
        requestRoute: new URL(request.url()).pathname,
        timestamp: Date.now(),
      });
    }
  });

  page.on("requestfinished", (request) => {
    requestActivity.pendingFirstPartyPosts.delete(request);
    if (
      request.method() === "POST" &&
      new URL(request.url()).origin === parsedBaseUrl.origin
    ) {
      requestActivity.events.push({
        event: "finished",
        pageRoute: new URL(page.url()).pathname,
        requestRoute: new URL(request.url()).pathname,
        timestamp: Date.now(),
      });
    }
  });

  page.on("console", (message) => {
    if (monitoring && message.type() === "error") {
      consoleErrors.push(message.text().slice(0, 500));
    }
  });

  page.on("requestfailed", (request) => {
    requestActivity.pendingFirstPartyPosts.delete(request);

    if (
      request.method() === "POST" &&
      new URL(request.url()).origin === parsedBaseUrl.origin
    ) {
      requestActivity.events.push({
        event: "failed",
        pageRoute: new URL(page.url()).pathname,
        requestRoute: new URL(request.url()).pathname,
        timestamp: Date.now(),
      });
    }

    if (!monitoring) return;

    if (isAllowedRequestCancellation(request)) {
      allowedRequestCancellations.push({
        resourceType: request.resourceType(),
        route: new URL(request.url()).pathname,
      });
      return;
    }

    requestFailures.push({
      method: request.method(),
      resourceType: request.resourceType(),
      url: new URL(request.url()).pathname,
      error: request.failure()?.errorText?.slice(0, 200) ?? "unknown",
    });
  });

  page.on("pageerror", (error) => {
    if (monitoring) {
      pageErrors.push(error.message.slice(0, 500));
    }
  });

  page.on("response", (response) => {
    if (
      monitoring &&
      response.status() >= 500 &&
      new URL(response.url()).origin === parsedBaseUrl.origin
    ) {
      httpFailures.push({
        method: response.request().method(),
        route: new URL(response.url()).pathname,
        status: response.status(),
      });
    }
  });

  return {
    allowedRequestCancellations,
    consoleErrors,
    context,
    httpFailures,
    page,
    pageErrors,
    requestActivity,
    requestFailures,
    stopMonitoring: () => {
      monitoring = false;
    },
  };
};

const navigate = async (testPage, route) => {
  const navigationStartedAt = performance.now();
  let documentDurationMs = null;
  const postsStartedBeforeNavigation =
    testPage.requestActivity.firstPartyPostStarted;
  let error = null;
  let response = null;

  try {
    response = await testPage.page.goto(`${parsedBaseUrl.origin}${route}`, {
      timeout: 45_000,
      waitUntil: "domcontentloaded",
    });
    await testPage.page
      .getByRole("heading", { level: 1 })
      .waitFor({ state: "visible", timeout: 30_000 });
    documentDurationMs = Number(
      (performance.now() - navigationStartedAt).toFixed(1),
    );
    await testPage.page
      .waitForLoadState("networkidle", { timeout: 10_000 })
      .catch(() => undefined);

    if (route === "/dashboard/student") {
      const postDeadline = Date.now() + 15_000;
      let recommendationPostSettled = false;

      // Recommendation impressions are started by a hydrated useEffect. Wait
      // for that first-party POST to start and settle before superseding the
      // page; POST/API cancellations remain fatal in the monitor.
      while (Date.now() < postDeadline) {
        if (
          testPage.requestActivity.firstPartyPostStarted >
            postsStartedBeforeNavigation &&
          testPage.requestActivity.pendingFirstPartyPosts.size === 0
        ) {
          recommendationPostSettled = true;
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (!recommendationPostSettled) {
        throw new Error(
          `Recommendation telemetry did not settle on ${route} within 15 seconds.`,
        );
      }
    }
  } catch (caughtError) {
    error =
      caughtError instanceof Error
        ? caughtError.message.slice(0, 500)
        : "unknown navigation error";
  }

  const dashboardUnavailable = await testPage.page
    .getByText("Dashboard unavailable", { exact: false })
    .isVisible()
    .catch(() => false);

  return {
    route,
    status: response?.status() ?? null,
    durationMs:
      documentDurationMs ??
      Number((performance.now() - navigationStartedAt).toFixed(1)),
    dashboardUnavailable,
    error,
  };
};

const runWave = async (concurrency, wave) => {
  const pages = await Promise.all(
    Array.from({ length: concurrency }, () => createTestPage()),
  );
  const navigations = [];

  try {
    for (const route of routes) {
      const routeResults = await Promise.all(
        pages.map((testPage) => navigate(testPage, route)),
      );
      navigations.push(...routeResults);
    }
  } finally {
    pages.forEach(({ stopMonitoring }) => stopMonitoring());
    await Promise.all(pages.map(({ context }) => context.close()));
  }

  const consoleErrors = pages.flatMap(({ consoleErrors }) => consoleErrors);
  const pageErrors = pages.flatMap(({ pageErrors }) => pageErrors);
  const httpFailures = pages.flatMap(({ httpFailures }) => httpFailures);
  const requestFailures = pages.flatMap(
    ({ requestFailures }) => requestFailures,
  );
  const allowedRequestCancellations = pages.flatMap(
    ({ allowedRequestCancellations }) => allowedRequestCancellations,
  );
  const firstPostTimestamp = Math.min(
    ...pages.flatMap(({ requestActivity }) =>
      requestActivity.events.map(({ timestamp }) => timestamp),
    ),
  );
  const postLifecycle = pages
    .flatMap(({ requestActivity }, pageIndex) =>
      requestActivity.events.map(({ timestamp, ...event }) => ({
        pageIndex,
        ...event,
        elapsedMs: Number.isFinite(firstPostTimestamp)
          ? timestamp - firstPostTimestamp
          : null,
      })),
    )
    .slice(0, 100);
  const summary = summarizeNavigations(navigations);

  return {
    concurrency,
    wave,
    ...summary,
    consoleErrorCount: consoleErrors.length,
    consoleErrors: [...new Set(consoleErrors)].slice(0, 20),
    pageErrorCount: pageErrors.length,
    pageErrors: [...new Set(pageErrors)].slice(0, 20),
    httpFailureCount: httpFailures.length,
    httpFailures: httpFailures.slice(0, 30),
    requestFailureCount: requestFailures.length,
    requestFailures: requestFailures.slice(0, 30),
    allowedRscCancellationCount: allowedRequestCancellations.length,
    navigationFailures: navigations.filter(
      (navigation) =>
        navigation.error !== null ||
        navigation.status === null ||
        navigation.status >= 400 ||
        navigation.dashboardUnavailable,
    ),
    postLifecycle,
  };
};

const runMatrix = async () => {
  const levels = (args.get("--levels") ?? "1,5,10,15,20,30")
    .split(",")
    .map((value) => Number(value));
  const waves = Number(args.get("--waves") ?? "3");
  const pauseMs = Number(args.get("--pause-ms") ?? "3000");

  if (
    levels.some(
      (level) => !Number.isSafeInteger(level) || level < 1 || level > 30,
    ) ||
    !Number.isSafeInteger(waves) ||
    waves < 1 ||
    waves > 3 ||
    !Number.isSafeInteger(pauseMs) ||
    pauseMs < 0
  ) {
    throw new Error("Unsafe matrix parameters.");
  }

  for (const concurrency of levels) {
    for (let wave = 1; wave <= waves; wave += 1) {
      const result = await runWave(concurrency, wave);
      results.matrix.push(result);
      await writeFile(outputPath, `${JSON.stringify(results, null, 2)}\n`);
      console.log(
        `matrix concurrency=${concurrency} wave=${wave} success=${result.successfulNavigations}/${result.navigationCount} p95_ms=${result.p95Ms}`,
      );

      if (
        result.failedNavigations > 0 ||
        result.consoleErrorCount > 0 ||
        result.pageErrorCount > 0 ||
        result.httpFailureCount > 0 ||
        result.requestFailureCount > 0
      ) {
        throw new Error(
          `Stopped after unhealthy wave ${wave} at concurrency ${concurrency}.`,
        );
      }

      if (pauseMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, pauseMs));
      }
    }
  }
};

const runSoak = async () => {
  const durationMinutes = Number(args.get("--duration-minutes") ?? "15");
  const intervalMs = Number(args.get("--interval-ms") ?? "5000");
  const contextCount = Number(args.get("--contexts") ?? "3");

  if (
    !Number.isFinite(durationMinutes) ||
    durationMinutes < 15 ||
    durationMinutes > 20 ||
    !Number.isSafeInteger(intervalMs) ||
    intervalMs < 3_000 ||
    !Number.isSafeInteger(contextCount) ||
    contextCount < 2 ||
    contextCount > 5
  ) {
    throw new Error("Unsafe soak parameters.");
  }

  const pages = await Promise.all(
    Array.from({ length: contextCount }, () => createTestPage()),
  );
  const navigations = [];
  const soakStartedAt = Date.now();
  const soakDeadline = soakStartedAt + durationMinutes * 60_000;
  let cycle = 0;

  try {
    while (Date.now() < soakDeadline) {
      const testPage = pages[cycle % pages.length];
      const route = routes[cycle % routes.length];
      const result = await navigate(testPage, route);
      navigations.push(result);
      cycle += 1;

      if (
        result.error !== null ||
        result.status === null ||
        result.status >= 400 ||
        result.dashboardUnavailable
      ) {
        throw new Error(`Stopped after unhealthy soak cycle ${cycle}.`);
      }

      if (cycle % 10 === 0) {
        results.soak = {
          durationMinutes,
          intervalMs,
          contextCount,
          cycles: cycle,
          ...summarizeNavigations(navigations),
          consoleErrorCount: pages.reduce(
            (total, page) => total + page.consoleErrors.length,
            0,
          ),
          pageErrorCount: pages.reduce(
            (total, page) => total + page.pageErrors.length,
            0,
          ),
          httpFailureCount: pages.reduce(
            (total, page) => total + page.httpFailures.length,
            0,
          ),
          requestFailureCount: pages.reduce(
            (total, page) => total + page.requestFailures.length,
            0,
          ),
        };
        await writeFile(outputPath, `${JSON.stringify(results, null, 2)}\n`);
        console.log(
          `soak cycles=${cycle} success=${results.soak.successfulNavigations}/${results.soak.navigationCount} p95_ms=${results.soak.p95Ms}`,
        );
      }

      const remainingMs = soakDeadline - Date.now();
      if (remainingMs > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.min(intervalMs, remainingMs)),
        );
      }
    }
  } finally {
    pages.forEach(({ stopMonitoring }) => stopMonitoring());
    await Promise.all(pages.map(({ context }) => context.close()));
  }

  results.soak = {
    durationMinutes,
    intervalMs,
    contextCount,
    cycles: cycle,
    ...summarizeNavigations(navigations),
    consoleErrorCount: pages.reduce(
      (total, page) => total + page.consoleErrors.length,
      0,
    ),
    consoleErrors: [
      ...new Set(pages.flatMap((page) => page.consoleErrors)),
    ].slice(0, 20),
    pageErrorCount: pages.reduce(
      (total, page) => total + page.pageErrors.length,
      0,
    ),
    pageErrors: [...new Set(pages.flatMap((page) => page.pageErrors))].slice(
      0,
      20,
    ),
    httpFailureCount: pages.reduce(
      (total, page) => total + page.httpFailures.length,
      0,
    ),
    httpFailures: pages.flatMap((page) => page.httpFailures).slice(0, 30),
    requestFailureCount: pages.reduce(
      (total, page) => total + page.requestFailures.length,
      0,
    ),
    requestFailures: pages.flatMap((page) => page.requestFailures).slice(0, 30),
  };

  if (
    results.soak.consoleErrorCount > 0 ||
    results.soak.pageErrorCount > 0 ||
    results.soak.httpFailureCount > 0 ||
    results.soak.requestFailureCount > 0
  ) {
    throw new Error("The soak completed with browser diagnostics failures.");
  }
};

try {
  await authenticate();

  if (mode === "matrix") {
    await runMatrix();
  } else {
    await runSoak();
  }

  const allNavigations =
    mode === "matrix"
      ? results.matrix.flatMap((wave) =>
          Array.from({ length: wave.navigationCount }, () => ({
            durationMs: wave.medianMs ?? 0,
            status: wave.failedNavigations === 0 ? 200 : null,
            error: wave.failedNavigations === 0 ? null : "wave failure",
            dashboardUnavailable: wave.failedNavigations > 0,
          })),
        )
      : [];

  results.aggregate =
    mode === "matrix"
      ? {
          waves: results.matrix.length,
          navigationCount: results.matrix.reduce(
            (total, wave) => total + wave.navigationCount,
            0,
          ),
          successfulNavigations: results.matrix.reduce(
            (total, wave) => total + wave.successfulNavigations,
            0,
          ),
          failedNavigations: results.matrix.reduce(
            (total, wave) => total + wave.failedNavigations,
            0,
          ),
          consoleErrorCount: results.matrix.reduce(
            (total, wave) => total + wave.consoleErrorCount,
            0,
          ),
          pageErrorCount: results.matrix.reduce(
            (total, wave) => total + wave.pageErrorCount,
            0,
          ),
          httpFailureCount: results.matrix.reduce(
            (total, wave) => total + wave.httpFailureCount,
            0,
          ),
          requestFailureCount: results.matrix.reduce(
            (total, wave) => total + wave.requestFailureCount,
            0,
          ),
          statusDistribution: allNavigations.reduce((distribution, item) => {
            const key = String(item.status ?? "navigation-error");
            distribution[key] = (distribution[key] ?? 0) + 1;
            return distribution;
          }, {}),
        }
      : results.soak;
} finally {
  results.finishedAt = new Date().toISOString();
  await writeFile(outputPath, `${JSON.stringify(results, null, 2)}\n`);
  await browser.close();
  await rm(temporaryDirectory, { force: true, recursive: true });
}

console.log(
  `Authenticated ${mode} completed for ${parsedBaseUrl.hostname}; detailed results were written without credentials.`,
);
