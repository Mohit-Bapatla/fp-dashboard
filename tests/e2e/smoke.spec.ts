import { expect, test } from "./fixtures";

const fundraisingMailto =
  "mailto:fundraising@futurephysicians.org?subject=Funding%20Future%20Physicians";
const partnershipMailto =
  "mailto:outreach@futurephysicians.org?subject=Future%20Physicians%20Partnership%20Inquiry";
const fundraisingContact = "/contact#fundraising";
const generalSupportContact = "/contact#general-support";
const partnershipContact = "/contact#partnerships";

const organizationMetrics = [
  ["2,000+", "Students in the FP community"],
  ["50+", "Partner organizations"],
  ["$300K+", "Student stipends facilitated through partner programs"],
] as const;

const impactMethodologyNote =
  "These figures represent cumulative Future Physicians activity as of July 20, 2026. The stipend figure reflects funding facilitated through partner programs, not money paid directly by Future Physicians.";
const substackAccessibleName = "Future Physicians newsletter on Substack";

const publicRoutes = [
  "/opportunities",
  "/students",
  "/partners",
  "/events",
  "/events/global-healthcare-seminar-2025",
  "/chapters",
  "/about",
  "/impact",
  "/support",
  "/faq",
  "/contact",
  "/accessibility",
  "/data-deletion",
  "/privacy",
  "/terms",
] as const;

const refinementAuditRoutes = [
  "/",
  "/support",
  "/contact",
  "/events/global-healthcare-seminar-2025",
  "/partners",
  "/students",
  "/chapters",
  "/faq",
  "/opportunities",
] as const;

const requiredViewports = [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 430, height: 932 },
  { width: 390, height: 844 },
  { width: 375, height: 812 },
  { width: 360, height: 800 },
  { width: 320, height: 700 },
] as const;

test("homepage explains the product and exposes the public navigation", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Future Physicians/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Build your path into healthcare.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Primary navigation" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Create Free Profile/ }).first(),
  ).toHaveAttribute("href", /\/sign-up\?redirect_url=/);
  await expect(
    page.getByRole("link", { name: "Explore Opportunities" }).first(),
  ).toHaveAttribute("href", "/opportunities");
  await expect(
    page.getByRole("link", { name: "Sign In", exact: true }).first(),
  ).toHaveAttribute("href", "/sign-in");

  const footer = page.getByRole("contentinfo");
  for (const [name, href] of [
    ["Events", "/events"],
    ["Chapters", "/chapters"],
    ["Support Us", "/support"],
    ["Impact", "/impact"],
  ] as const) {
    await expect(
      footer.getByRole("link", { name, exact: true }),
    ).toHaveAttribute("href", href);
  }
});

test("homepage keeps the approved metrics and removes unrelated program previews", async ({
  page,
}) => {
  await page.goto("/");

  expect(
    await page.locator("#main-content > section").count(),
  ).toBeLessThanOrEqual(6);

  for (const [value, label] of organizationMetrics) {
    const metricLabel = page.getByText(label, { exact: true }).first();
    await expect(metricLabel).toBeVisible();
    await expect(metricLabel.locator("..")).toContainText(value);
  }
  await expect(
    page.getByText(impactMethodologyNote, { exact: true }),
  ).toBeVisible();

  await expect(
    page.getByText("Create Partner Workspace", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Contact Our Outreach Team" }),
  ).toHaveAttribute("href", partnershipContact);
  await expect(
    page.getByRole("link", { name: /Current partner.*sign in/i }),
  ).toHaveAttribute("href", /\/sign-in(?:\?|$)/);
  await expect(page.locator('iframe[src*="youtube"]')).toHaveCount(0);
  await expect(page.getByText("Registrations", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("heading", {
      name: "Bring Future Physicians to your school.",
    }),
  ).toHaveCount(0);
  for (const grantAmount of ["$15,000", "$1,000", "$720"]) {
    await expect(page.getByText(grantAmount, { exact: true })).toHaveCount(0);
  }

  const sectionIds = await page
    .locator("#main-content > section")
    .evaluateAll((sections) => sections.map((section) => section.id));
  expect(sectionIds.at(-2)).toBe("homepage-faq");
  expect(sectionIds.at(-1)).toBe("partner-inquiry");
});

test("homepage opportunity showcase uses the wider section-specific layout", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const heading = page.getByRole("heading", {
    name: "Find opportunities that actually fit.",
  });
  const copy = heading.locator("..");
  const layout = copy.locator("..");
  const preview = page.locator("#opportunity-showcase figure");
  const [layoutBox, copyBox, previewBox, viewportWidth] = await Promise.all([
    layout.boundingBox(),
    copy.boundingBox(),
    preview.boundingBox(),
    page.evaluate(() => document.documentElement.clientWidth),
  ]);
  expect(layoutBox).not.toBeNull();
  expect(copyBox).not.toBeNull();
  expect(previewBox).not.toBeNull();

  expect(layoutBox?.width).toBeGreaterThanOrEqual(viewportWidth * 0.94);
  expect(previewBox?.width).toBeGreaterThan((copyBox?.width ?? 0) * 1.7);
});

test("mobile navigation is keyboard-accessible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const trigger = page.getByRole("button", { name: "Open navigation menu" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "For Students" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: substackAccessibleName }),
  ).toHaveAttribute("href", "https://futurephysicians.substack.com/");
  await expect(
    page.getByRole("button", { name: "Close navigation menu" }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect
    .poll(() =>
      page.evaluate(() =>
        Boolean(
          document.activeElement?.closest('[role="dialog"]') ??
          document.activeElement?.closest("[data-popup-open]"),
        ),
      ),
    )
    .toBe(true);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("desktop Explore disclosure exposes state and closes with Escape", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const trigger = page.getByRole("button", { name: "Explore" });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("link", { name: /Opportunities\s+Browse verified/ }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
});

test("key public pages avoid horizontal overflow at required breakpoints", async ({
  page,
}) => {
  test.setTimeout(150_000);

  for (const url of refinementAuditRoutes) {
    for (const viewport of requiredViewports) {
      await page.setViewportSize(viewport);
      await page.goto(url, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(
        dimensions.scrollWidth,
        `${url} overflowed at ${viewport.width} x ${viewport.height}`,
      ).toBeLessThanOrEqual(dimensions.clientWidth + 1);
    }
  }

  for (const url of publicRoutes.filter(
    (route) => !(refinementAuditRoutes as readonly string[]).includes(route),
  )) {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto(url, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(
      dimensions.clientWidth + 1,
    );
  }
});

test("support metadata includes canonical social sharing images", async ({
  page,
}) => {
  await page.goto("/support");

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://futurephysicians.org/support",
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    "https://futurephysicians.org/og.png",
  );
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
    "content",
    "https://futurephysicians.org/og.png",
  );
});

test("support page includes fiscal-sponsor disclosure and exact inquiry destinations", async ({
  page,
}) => {
  await page.goto("/support");

  for (const value of ["$15,000", "$1,000", "$720"]) {
    await expect(page.getByText(value, { exact: true })).toHaveCount(0);
  }
  await expect(
    page.getByText(/fiscally sponsored by The Hack Foundation/i).first(),
  ).toBeVisible();
  await expect(page.getByText(/official receipt from HCB/i)).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: "Review HCB fiscal-sponsorship information",
    }),
  ).toHaveAttribute("href", "https://hcb.hackclub.com/branding");
  await expect(
    page.getByText(/These are neutral operating categories/i),
  ).toHaveCount(0);
  await expect(page.getByText(/approved public content/i)).toHaveCount(0);
  await expect(page.getByText("Funding transparency")).toHaveCount(0);
  await expect(page.getByText("Financial transparency boundaries")).toHaveCount(
    0,
  );
  await expect(
    page.getByText("outreach@futurephysicians.org", { exact: true }),
  ).toBeVisible();
  const discussFunding = page
    .getByRole("link", { name: /Discuss funding/i })
    .first();
  await expect(discussFunding).toHaveAttribute("href", fundraisingContact);

  const fundraisingLinks = page.getByRole("link", {
    name: "fundraising@futurephysicians.org",
    exact: true,
  });
  expect(await fundraisingLinks.count()).toBeGreaterThan(0);
  for (const link of await fundraisingLinks.all()) {
    await expect(link).toHaveAttribute("href", fundraisingMailto);
  }

  const partnershipLinks = page.getByRole("link", {
    name: "outreach@futurephysicians.org",
    exact: true,
  });
  expect(await partnershipLinks.count()).toBeGreaterThan(0);
  for (const link of await partnershipLinks.all()) {
    await expect(link).toHaveAttribute("href", partnershipMailto);
  }

  await discussFunding.click();
  await expect(page).toHaveURL(/\/contact#fundraising$/);
  const fundraisingSection = page.locator("#fundraising");
  await expect(fundraisingSection).toBeVisible();
  await expect(
    fundraisingSection.getByRole("link", {
      name: "fundraising@futurephysicians.org",
      exact: true,
    }),
  ).toHaveAttribute("href", fundraisingMailto);
  await expect
    .poll(async () => (await fundraisingSection.boundingBox())?.y ?? 0)
    .toBeGreaterThanOrEqual(72);
});

test("fundraising email stays atomic and inside the viewport on mobile", async ({
  page,
}) => {
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/support", { waitUntil: "domcontentloaded" });

    const fundraisingLinks = page.getByRole("link", {
      name: "fundraising@futurephysicians.org",
      exact: true,
    });
    expect(await fundraisingLinks.count()).toBeGreaterThan(0);

    const linkLayouts = await fundraisingLinks.evaluateAll((links) =>
      links.map((link) => {
        const nowrapElement = link.querySelector("span") ?? link;
        const range = document.createRange();
        range.selectNodeContents(nowrapElement);
        const lineTops = new Set(
          [...range.getClientRects()]
            .filter((rect) => rect.width > 0 && rect.height > 0)
            .map((rect) => Math.round(rect.top)),
        );
        const rect = nowrapElement.getBoundingClientRect();

        return {
          left: rect.left,
          lineCount: lineTops.size,
          right: rect.right,
          whiteSpace: getComputedStyle(nowrapElement).whiteSpace,
        };
      }),
    );

    for (const layout of linkLayouts) {
      expect(layout.whiteSpace).toBe("nowrap");
      expect(layout.lineCount).toBe(1);
      expect(layout.left).toBeGreaterThanOrEqual(-1);
      expect(layout.right).toBeLessThanOrEqual(width + 1);
    }

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(
      dimensions.clientWidth + 1,
    );
  }
});

test("general support navigation lands on the visible contact section", async ({
  page,
}) => {
  await page.goto("/faq");
  const contactSupport = page.getByRole("link", { name: "Contact support" });
  await expect(contactSupport).toHaveAttribute("href", generalSupportContact);
  await contactSupport.click();

  await expect(page).toHaveURL(/\/contact#general-support$/);
  const supportSection = page.locator("#general-support");
  await expect(supportSection).toBeVisible();
  await expect(
    supportSection.getByRole("link", {
      name: "support@futurephysicians.org",
      exact: true,
    }),
  ).toHaveAttribute("href", "mailto:support@futurephysicians.org");

  await page.goto("/contact");
  await expect(
    page.getByText(
      /Do not email passwords, full identification documents, private student records/i,
    ),
  ).toBeVisible();
  await expect(
    page.getByText("No response time is promised on this page.", {
      exact: true,
    }),
  ).toHaveCount(0);
  const samePageSupport = page.getByRole("link", {
    name: "Email general support",
  });
  await expect(samePageSupport).toHaveAttribute("href", "#general-support");
  await samePageSupport.click();
  await expect(page).toHaveURL(/\/contact#general-support$/);
});

test("partners page uses approval-based outreach and preserves sign-in", async ({
  page,
}) => {
  await page.goto("/partners");

  await expect(
    page.getByText("Create Partner Workspace", { exact: true }),
  ).toHaveCount(0);

  const outreachLinks = page.getByRole("link", {
    name: /Contact Our Outreach Team/i,
  });
  expect(await outreachLinks.count()).toBeGreaterThan(0);
  for (const link of await outreachLinks.all()) {
    await expect(link).toHaveAttribute("href", partnershipContact);
  }

  await expect(
    page.getByRole("link", {
      name: /(?:already an approved|current) partner.*sign in/i,
    }),
  ).toHaveAttribute("href", /\/sign-in(?:\?|$)/);

  await outreachLinks.first().click();
  await expect(page).toHaveURL(/\/contact#partnerships$/);
  const partnershipSection = page.locator("#partnerships");
  await expect(partnershipSection).toBeVisible();
  await expect(
    partnershipSection.getByRole("link", {
      name: "outreach@futurephysicians.org",
      exact: true,
    }),
  ).toHaveAttribute("href", partnershipMailto);
});

test("impact page keeps exact metrics and removes the metric glossary", async ({
  page,
}) => {
  await page.goto("/impact");

  for (const [value, label] of organizationMetrics) {
    const metricLabel = page.getByText(label, { exact: true }).first();
    await expect(metricLabel).toBeVisible();
    await expect(metricLabel.locator("..")).toContainText(value);
  }
  await expect(
    page.getByText(impactMethodologyNote, { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Metric glossary", { exact: false })).toHaveCount(
    0,
  );
  await expect(page.locator("#definitions")).toHaveCount(0);
  await expect(page.locator('a[href="#definitions"]')).toHaveCount(0);
});

test("newsletter destinations use the official accessible Substack mark", async ({
  page,
}) => {
  for (const route of [
    "/",
    "/contact",
    "/events",
    "/events/global-healthcare-seminar-2025",
  ]) {
    await page.goto(route);
    const links = page.getByRole("link", { name: substackAccessibleName });
    expect(
      await links.count(),
      `${route} should expose Substack`,
    ).toBeGreaterThan(0);

    for (const link of await links.all()) {
      await expect(link).toHaveAttribute(
        "href",
        "https://futurephysicians.substack.com/",
      );
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
      await expect(link.locator("svg[data-substack-mark]")).toHaveCount(1);
      const box = await link.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  }
});

test("FAQ answers and structured data use the same approved wording", async ({
  page,
}) => {
  await page.goto("/faq");

  const expectedAnswers = {
    "Is Future Physicians free for students?":
      "Yes. Creating a student profile and using the FP Dashboard is free.",
    "Who can create a student profile?":
      "People age 13 or older who are interested in exploring a healthcare career or gaining healthcare experience can create a student profile.",
    "Does Future Physicians guarantee a placement?":
      "No. Future Physicians helps students find relevant opportunities and stay organized throughout the application process, but each host organization makes its own acceptance and placement decisions.",
  } as const;

  for (const [question, answer] of Object.entries(expectedAnswers)) {
    await page.getByRole("button", { name: question }).click();
    await expect(page.getByText(answer, { exact: true })).toBeVisible();
  }

  const structuredAnswers = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((scripts) => {
      for (const script of scripts) {
        try {
          const value = JSON.parse(script.textContent ?? "{}");
          if (value["@type"] === "FAQPage") {
            return Object.fromEntries(
              value.mainEntity.map(
                (entry: { acceptedAnswer: { text: string }; name: string }) => [
                  entry.name,
                  entry.acceptedAnswer.text,
                ],
              ),
            );
          }
        } catch {
          // Ignore unrelated structured-data blocks.
        }
      }
      return {};
    });

  for (const [question, answer] of Object.entries(expectedAnswers)) {
    expect(structuredAnswers[question]).toBe(answer);
  }
  expect(Object.values(structuredAnswers).join(" ")).not.toMatch(
    /way more likely|guaranteed acceptance|guaranteed interviews|guaranteed responses/i,
  );
});

test("seminar and chapter pages keep their approved destinations", async ({
  page,
}) => {
  await page.goto("/events/global-healthcare-seminar-2025");
  await expect(
    page.getByText("September 27, 2025", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Watch/ }).first(),
  ).toHaveAttribute("href", "https://www.youtube.com/watch?v=6U2EA3O12YY");
  await expect(
    page.getByRole("heading", { name: "Institutional recognition" }),
  ).toBeVisible();
  await expect(page.getByText("UC Riverside", { exact: true })).toBeVisible();
  await expect(
    page.getByText("The George Washington University", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Recognition is not the same as partnership"),
  ).toHaveCount(0);
  await expect(
    page.getByText(/These names are not presented as sponsors/i),
  ).toHaveCount(0);

  await page.goto("/chapters");
  await expect(
    page.getByRole("link", { name: /Start.*chapter/i }).first(),
  ).toHaveAttribute(
    "href",
    "https://docs.google.com/forms/d/e/1FAIpQLSeT-FOoYXGwLMgDIqr-kTCPGceFSnkgn_FAyp3C_9M9eo6y3g/viewform",
  );
  await expect(
    page.getByRole("heading", { name: "What a chapter is not" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "What a chapter is", exact: true }),
  ).toBeVisible();
});

test("legacy support route redirects permanently", async ({ page }) => {
  const response = await page.request.get("/grants-sponsors", {
    maxRedirects: 0,
  });

  expect([307, 308]).toContain(response.status());
  expect(response.headers().location).toBe("/support#grants");

  const donateResponse = await page.request.get("/donate", {
    maxRedirects: 0,
  });
  expect([307, 308]).toContain(donateResponse.status());
  expect(donateResponse.headers().location).toBe("/support#donate");

  await page.goto("/support#donate");
  await expect(page.locator("#donate")).toBeVisible();
});

test("sign-in page loads", async ({ page }) => {
  test.skip(
    process.env.E2E_CLERK_AVAILABLE !== "true",
    "A real Clerk browser-test environment is required.",
  );
  await page.goto("/");
  await page
    .getByRole("banner")
    .getByRole("link", { name: "Sign In", exact: true })
    .click();

  await expect(page).toHaveURL(/sign-in/);
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByRole("link", { name: /Sign up/i })).toBeVisible();
});

test("sign-up page renders Clerk account creation", async ({ page }) => {
  test.skip(
    process.env.E2E_CLERK_AVAILABLE !== "true",
    "A real Clerk browser-test environment is required.",
  );
  await page.goto("/sign-up");

  await expect(page).toHaveURL(/sign-up/);
  await expect(
    page.getByRole("heading", { name: "Create your account" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();
});

test("signed-out dashboard redirects to sign-in", async ({ page }) => {
  test.skip(
    process.env.E2E_CLERK_AVAILABLE !== "true",
    "Signed-out Clerk routing requires configured development credentials.",
  );

  await page.goto("/dashboard");

  await expect(page).toHaveURL(/sign-in/);
});

test("unknown public opportunity returns not found", async ({ page }) => {
  const response = await page.request.get(
    "/opportunities/not-a-real-opportunity",
    { maxRedirects: 0 },
  );

  expect(response.status()).toBe(404);
});

test("opportunity directory renders real results or its safe failure state", async ({
  page,
}) => {
  const response = await page.goto("/opportunities");

  expect(
    response,
    "The opportunity directory must return a document",
  ).not.toBeNull();
  expect(response?.status()).toBeLessThan(500);
  const resultHeading = page.getByRole("heading", {
    level: 2,
    name: /\d+ verified opportunit(?:y|ies)/,
  });
  const unavailableHeading = page.getByRole("heading", {
    level: 1,
    name: "Opportunities are temporarily unavailable.",
  });
  await expect
    .poll(
      async () =>
        (await resultHeading.count()) + (await unavailableHeading.count()),
      {
        message:
          "The directory must render real query results or the explicit safe failure state",
      },
    )
    .toBeGreaterThan(0);

  if ((await unavailableHeading.count()) > 0) {
    await expect(unavailableHeading).toBeVisible();
    await expect(page.getByText(/Please check back shortly/i)).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Contact support" }),
    ).toHaveAttribute("href", generalSupportContact);
    await expect(page.locator("body")).not.toContainText(
      /Prisma|P2021|P2022|public\.Opportunity/,
    );
  } else {
    await expect(resultHeading).toBeVisible();
    if ((await resultHeading.textContent())?.trim().startsWith("0 ")) {
      await expect(
        page.getByRole("heading", {
          name: "No public listings are open right now",
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Reset filters" }),
      ).toHaveCount(0);
    }
  }
});
