import {
  expect,
  test as base,
  type ConsoleMessage,
  type Page,
  type Request,
  type Response,
  type TestInfo,
} from "@playwright/test";

type RuntimeIssueKind =
  | "application-error-boundary"
  | "console-error"
  | "console-warning"
  | "http-5xx"
  | "page-error"
  | "request-failed";

type RuntimeIssue = {
  detail: string;
  kind: RuntimeIssueKind;
  url?: string;
};

type AllowedConsoleMessage = {
  locationPattern?: RegExp;
  pattern: RegExp;
  reason: string;
  type: "error" | "warning";
};

const allowedConsoleMessages: readonly AllowedConsoleMessage[] = [
  {
    // Clerk prints this for local development instances on every page. It is
    // expected in E2E and does not represent an application failure.
    pattern:
      /^Clerk: Clerk has been loaded with development keys\. Development instances have strict usage limits/,
    reason: "Clerk development-key notice",
    type: "warning",
  },
  {
    // Chromium does not currently recognize this otherwise valid iframe
    // permissions-policy token. YouTube includes it in the seminar embed.
    pattern: /^Unrecognized feature: 'web-share'\.$/,
    reason: "Chromium web-share permissions-policy notice",
    type: "warning",
  },
  {
    // Clerk's hosted development sign-in page reports this CSP fallback as a
    // console error even though the page loads and authenticates normally.
    locationPattern: /^https:\/\/[^/]+\.accounts\.dev\//,
    pattern:
      /^\s*Note that 'script-src' was not explicitly set, so 'default-src' is used as a fallback\.$/,
    reason: "Clerk hosted development-page CSP notice",
    type: "error",
  },
  {
    // The privacy-enhanced YouTube player probes the Compute Pressure API in
    // its own cross-origin document. Chromium blocks it and reports this exact
    // vendor policy message without affecting the first-party page or player.
    locationPattern:
      /^https:\/\/www\.youtube-nocookie\.com\/s\/player\/[^/]+\/player_embed_es6\.vflset\/en_US\/base\.js:/,
    pattern:
      /^Permissions policy violation: compute-pressure is not allowed in this document\.$/,
    reason: "YouTube compute-pressure permissions-policy notice",
    type: "error",
  },
];

const applicationErrorSignatures = [
  "Application error: a client-side exception has occurred",
  "Application error: a server-side exception has occurred",
  "Internal Server Error",
] as const;

function isApplicationUrl(url: string, baseURL: string | undefined) {
  if (!baseURL) return false;

  try {
    return new URL(url).origin === new URL(baseURL).origin;
  } catch {
    return false;
  }
}

function getConsoleLocation(message: ConsoleMessage) {
  const location = message.location();
  return location.url
    ? `${location.url}:${location.lineNumber}:${location.columnNumber}`
    : undefined;
}

function isAllowedConsoleMessage(message: ConsoleMessage) {
  const location = getConsoleLocation(message) ?? "";

  return allowedConsoleMessages.some(
    ({ locationPattern, pattern, type }) =>
      message.type() === type &&
      pattern.test(message.text()) &&
      (!locationPattern || locationPattern.test(location)),
  );
}

function formatRequestFailure(request: Request) {
  const failure = request.failure();
  return `${request.method()} ${request.url()} (${failure?.errorText ?? "unknown network error"})`;
}

function formatHttpFailure(response: Response) {
  return `${response.status()} ${response.request().method()} ${response.url()}`;
}

function isAllowedRequestCancellation(request: Request) {
  if (
    request.method() !== "GET" ||
    request.failure()?.errorText !== "net::ERR_ABORTED"
  ) {
    return false;
  }

  try {
    const url = new URL(request.url());
    const pathname = url.pathname;

    // Next may cancel an in-flight React Server Component prefetch when a test
    // intentionally navigates elsewhere. Restrict this allowance to aborted
    // same-origin GET fetches carrying Next's exact RSC query marker; HTTP
    // failures, document requests, scripts, and ordinary application fetches
    // remain failures.
    if (
      url.searchParams.has("_rsc") &&
      ["fetch", "xhr"].includes(request.resourceType())
    ) {
      return true;
    }

    // Next's development-only font endpoint can still be fetching when an
    // intentional multi-page test navigates again. Only that exact browser
    // cancellation is harmless; failed/5xx font responses still fail.
    if (
      request.resourceType() === "font" &&
      pathname === "/__nextjs_font/geist-latin.woff2"
    ) {
      return true;
    }

    // Turbopack may rotate and cancel its development HMR client chunk while a
    // multi-page test navigates. Limit the allowance to that encoded dev-only
    // script path; failed application chunks and production assets still fail.
    return (
      request.resourceType() === "script" &&
      /^\/_next\/static\/chunks\/%5Bturbopack%5D_browser_dev_hmr-client_hmr-client_ts_[^/]+\.js$/i.test(
        pathname,
      )
    );
  } catch {
    return false;
  }
}

async function findApplicationErrorBoundary(page: Page) {
  if (page.isClosed() || page.url() === "about:blank") return null;

  const visibleNextErrorOverlay = await page
    .locator("nextjs-portal")
    .isVisible()
    .catch(() => false);
  if (visibleNextErrorOverlay) {
    return "Next.js displayed its development error overlay";
  }

  const bodyText = await page
    .locator("body")
    .innerText({ timeout: 1_000 })
    .catch(() => "");

  return (
    applicationErrorSignatures.find((signature) =>
      bodyText.includes(signature),
    ) ?? null
  );
}

function installRuntimeErrorMonitor(
  page: Page,
  baseURL: string | undefined,
  issues: RuntimeIssue[],
) {
  const onPageError = (error: Error) => {
    issues.push({
      detail: error.stack ?? error.message,
      kind: "page-error",
      url: page.url(),
    });
  };
  const onConsole = (message: ConsoleMessage) => {
    const type = message.type();
    const text = message.text();

    if (isAllowedConsoleMessage(message)) return;

    if (type === "error") {
      issues.push({
        detail: text,
        kind: "console-error",
        url: getConsoleLocation(message),
      });
    } else if (type === "warning") {
      issues.push({
        detail: text,
        kind: "console-warning",
        url: getConsoleLocation(message),
      });
    }
  };
  const onRequestFailed = (request: Request) => {
    if (
      !isApplicationUrl(request.url(), baseURL) ||
      isAllowedRequestCancellation(request)
    ) {
      return;
    }

    issues.push({
      detail: formatRequestFailure(request),
      kind: "request-failed",
      url: request.url(),
    });
  };
  const onResponse = (response: Response) => {
    if (response.status() < 500 || !isApplicationUrl(response.url(), baseURL)) {
      return;
    }

    issues.push({
      detail: formatHttpFailure(response),
      kind: "http-5xx",
      url: response.url(),
    });
  };

  page.on("pageerror", onPageError);
  page.on("console", onConsole);
  page.on("requestfailed", onRequestFailed);
  page.on("response", onResponse);

  return () => {
    page.off("pageerror", onPageError);
    page.off("console", onConsole);
    page.off("requestfailed", onRequestFailed);
    page.off("response", onResponse);
  };
}

function formatIssues(issues: RuntimeIssue[]) {
  return issues
    .map(
      ({ detail, kind, url }, index) =>
        `${index + 1}. [${kind}] ${detail}${url ? `\n   ${url}` : ""}`,
    )
    .join("\n");
}

async function attachIssues(testInfo: TestInfo, issues: RuntimeIssue[]) {
  await testInfo.attach("unexpected-browser-runtime-errors", {
    body: Buffer.from(JSON.stringify(issues, null, 2)),
    contentType: "application/json",
  });
}

type ErrorMonitorFixtures = {
  runtimeErrorMonitor: void;
};

/**
 * Playwright base fixture that turns browser-visible application failures into
 * test failures. Import `test` and `expect` from this module in every E2E spec.
 */
export const test = base.extend<ErrorMonitorFixtures>({
  runtimeErrorMonitor: [
    async ({ page }, use, testInfo) => {
      const issues: RuntimeIssue[] = [];
      const removeListeners = installRuntimeErrorMonitor(
        page,
        testInfo.project.use.baseURL,
        issues,
      );

      await use();

      const errorBoundary = await findApplicationErrorBoundary(page);
      if (errorBoundary) {
        issues.push({
          detail: errorBoundary,
          kind: "application-error-boundary",
          url: page.url(),
        });
      }

      removeListeners();

      if (issues.length > 0) {
        await attachIssues(testInfo, issues);
      }

      expect(
        issues,
        `Unexpected browser/application runtime failures:\n${formatIssues(issues)}`,
      ).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
