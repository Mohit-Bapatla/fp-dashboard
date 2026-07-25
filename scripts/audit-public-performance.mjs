import { chromium, devices } from "@playwright/test";

const allowedRoutes = new Set(["/", "/opportunities", "/sign-in", "/sign-up"]);
const args = new Map(
  process.argv.slice(2).map((argument) => {
    const [key, ...value] = argument.split("=");
    return [key, value.join("=")];
  }),
);
const baseUrl = args.get("--base-url") ?? "http://127.0.0.1:3000";
const profile = args.get("--profile") ?? "desktop";
const requestedRoutes = (args.get("--routes") ?? "/").split(",");
const runs = Number(args.get("--runs") ?? "3");

if (!["desktop", "mobile-slow-4g"].includes(profile)) {
  throw new Error("Use --profile=desktop or --profile=mobile-slow-4g.");
}

if (
  !Number.isInteger(runs) ||
  runs < 1 ||
  runs > 10 ||
  requestedRoutes.some((route) => !allowedRoutes.has(route))
) {
  throw new Error(
    "Use 1-10 runs and only public routes: /, /opportunities, /sign-in, /sign-up.",
  );
}

function median(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length === 0) return null;
  if (sorted.length % 2 === 1) return sorted[middle];
  return (sorted[middle - 1] + sorted[middle]) / 2;
}

function summarize(samples) {
  const numberFields = [
    "cls",
    "domContentLoadedMs",
    "fcpMs",
    "firstPartyTransferBytes",
    "jsTransferBytes",
    "lcpMs",
    "loadMs",
    "longTaskDurationMs",
    "ttfbMs",
  ];

  return Object.fromEntries([
    ...numberFields.map((field) => [
      field,
      median(samples.map((sample) => sample[field])),
    ]),
    [
      "consoleErrorCount",
      Math.max(...samples.map((sample) => sample.consoleErrorCount)),
    ],
    [
      "failedRequestCount",
      Math.max(...samples.map((sample) => sample.failedRequestCount)),
    ],
    [
      "lcpElements",
      [...new Set(samples.map((sample) => sample.lcpElement).filter(Boolean))],
    ],
  ]);
}

const browser = await chromium.launch();
const output = {
  baseUrl,
  measuredAt: new Date().toISOString(),
  profile,
  profileDetails:
    profile === "mobile-slow-4g"
      ? {
          cpuSlowdownMultiplier: 4,
          downloadBitsPerSecond: 1_600_000,
          latencyMs: 150,
          uploadBitsPerSecond: 750_000,
          viewport: devices["iPhone 13"].viewport,
        }
      : {
          cpuSlowdownMultiplier: 1,
          network: "host connection",
          viewport: { height: 900, width: 1440 },
        },
  routes: {},
  runs,
};

for (const route of requestedRoutes) {
  const samples = [];

  for (let run = 0; run < runs; run += 1) {
    const context = await browser.newContext(
      profile === "mobile-slow-4g"
        ? { ...devices["iPhone 13"] }
        : { viewport: { height: 900, width: 1440 } },
    );
    const page = await context.newPage();
    const consoleErrors = [];
    const failedRequests = [];

    if (profile === "mobile-slow-4g") {
      const session = await context.newCDPSession(page);
      await session.send("Network.enable");
      await session.send("Network.emulateNetworkConditions", {
        downloadThroughput: 1_600_000 / 8,
        latency: 150,
        offline: false,
        uploadThroughput: 750_000 / 8,
      });
      await session.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    }

    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("requestfailed", (request) => {
      const failure = request.failure()?.errorText ?? "unknown";
      if (failure !== "net::ERR_ABORTED") {
        failedRequests.push(
          `${request.method()} ${new URL(request.url()).pathname}`,
        );
      }
    });

    await page.addInitScript(() => {
      window.__PUBLIC_PERFORMANCE_AUDIT__ = {
        cls: 0,
        lcp: null,
        longTaskDuration: 0,
      };

      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__PUBLIC_PERFORMANCE_AUDIT__.lcp = {
            className:
              entry.element instanceof HTMLElement
                ? entry.element.className.toString().slice(0, 160)
                : "",
            id:
              entry.element instanceof HTMLElement
                ? entry.element.id.slice(0, 80)
                : "",
            startTime: entry.startTime,
            tagName:
              entry.element instanceof HTMLElement
                ? entry.element.tagName.toLowerCase()
                : "unknown",
          };
        }
      }).observe({ buffered: true, type: "largest-contentful-paint" });

      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            window.__PUBLIC_PERFORMANCE_AUDIT__.cls += entry.value;
          }
        }
      }).observe({ buffered: true, type: "layout-shift" });

      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__PUBLIC_PERFORMANCE_AUDIT__.longTaskDuration +=
            entry.duration;
        }
      }).observe({ buffered: true, type: "longtask" });
    });

    await page.goto(new URL(route, baseUrl).toString(), {
      waitUntil: "load",
    });
    await page.waitForTimeout(4_000);

    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType("navigation")[0];
      const resources = performance.getEntriesByType("resource");
      const fcp = performance
        .getEntriesByType("paint")
        .find((entry) => entry.name === "first-contentful-paint");
      const audit = window.__PUBLIC_PERFORMANCE_AUDIT__;
      const origin = window.location.origin;
      const firstPartyResources = resources.filter(
        (entry) => new URL(entry.name).origin === origin,
      );
      const scripts = firstPartyResources.filter(
        (entry) => entry.initiatorType === "script",
      );

      return {
        cls: audit.cls,
        domContentLoadedMs: navigation.domContentLoadedEventEnd,
        fcpMs: fcp?.startTime ?? null,
        firstPartyTransferBytes: firstPartyResources.reduce(
          (total, entry) => total + entry.transferSize,
          0,
        ),
        jsTransferBytes: scripts.reduce(
          (total, entry) => total + entry.transferSize,
          0,
        ),
        lcpElement: audit.lcp
          ? [audit.lcp.tagName, audit.lcp.id, audit.lcp.className]
              .filter(Boolean)
              .join("#")
          : null,
        lcpMs: audit.lcp?.startTime ?? null,
        loadMs: navigation.loadEventEnd,
        longTaskDurationMs: audit.longTaskDuration,
        ttfbMs: navigation.responseStart - navigation.requestStart,
      };
    });

    samples.push({
      ...metrics,
      consoleErrorCount: consoleErrors.length,
      failedRequestCount: failedRequests.length,
    });
    await context.close();
  }

  output.routes[route] = {
    median: summarize(samples),
    samples,
  };
}

await browser.close();
console.log(JSON.stringify(output, null, 2));
