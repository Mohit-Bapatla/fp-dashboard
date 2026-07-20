import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn(
    async () =>
      new Headers({ host: "localhost:3000", "x-forwarded-proto": "http" }),
  ),
}));

vi.mock("@clerk/nextjs", () => ({
  SignIn: (props: Record<string, string>) => (
    <div
      data-clerk-component="sign-in"
      data-fallback-redirect={props.fallbackRedirectUrl}
      data-force-redirect={props.forceRedirectUrl}
      data-path={props.path}
      data-routing={props.routing}
      data-sign-up-url={props.signUpUrl}
    />
  ),
  SignUp: (props: Record<string, string>) => (
    <div
      data-clerk-component="sign-up"
      data-fallback-redirect={props.fallbackRedirectUrl}
      data-force-redirect={props.forceRedirectUrl}
      data-path={props.path}
      data-routing={props.routing}
      data-sign-in-url={props.signInUrl}
    />
  ),
}));

import SignInPage from "@/app/(auth)/sign-in/[[...sign-in]]/page";
import SignUpPage from "@/app/(auth)/sign-up/[[...sign-up]]/page";

describe("Clerk authentication pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Clerk SignIn component with the dashboard fallback", async () => {
    const page = await SignInPage({ searchParams: Promise.resolve({}) });
    const markup = renderToStaticMarkup(page);

    expect(markup).toContain('data-clerk-component="sign-in"');
    expect(markup).toContain('data-path="/sign-in"');
    expect(markup).toContain('data-routing="path"');
    expect(markup).toContain('data-fallback-redirect="/dashboard"');
    expect(markup).toContain('data-force-redirect="/dashboard"');
    expect(markup).toContain(
      'data-sign-up-url="/sign-up?redirect_url=%2Fdashboard"',
    );
  });

  it("renders the Clerk SignUp component with the student onboarding fallback", async () => {
    const page = await SignUpPage({ searchParams: Promise.resolve({}) });
    const markup = renderToStaticMarkup(page);

    expect(markup).toContain('data-clerk-component="sign-up"');
    expect(markup).toContain('data-path="/sign-up"');
    expect(markup).toContain('data-routing="path"');
    expect(markup).toContain(
      'data-fallback-redirect="/dashboard/student/onboarding"',
    );
    expect(markup).toContain(
      'data-force-redirect="/dashboard/student/onboarding"',
    );
  });
});
