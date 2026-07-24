import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getMarketingViewer: vi.fn(),
  headers: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@/lib/auth/marketing-viewer", () => ({
  getMarketingViewer: mocks.getMarketingViewer,
}));

vi.mock("next/headers", () => ({
  headers: mocks.headers,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

import SignInPage from "@/app/(auth)/sign-in/[[...sign-in]]/page";

describe("signed-in sign-in-page routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.headers.mockResolvedValue({
      get: () => null,
    });
    mocks.redirect.mockImplementation((destination: string) => {
      throw new Error(`REDIRECT:${destination}`);
    });
  });

  it.each([
    ["STUDENT", "/dashboard/student"],
    ["ADMIN", "/dashboard/admin"],
  ] as const)(
    "redirects a signed-in %s viewer before rendering Clerk",
    async (role, destination) => {
      mocks.getMarketingViewer.mockResolvedValue({
        role,
        userId: "clerk-user",
      });

      await expect(
        SignInPage({ searchParams: Promise.resolve({}) }),
      ).rejects.toThrow(`REDIRECT:${destination}`);
      expect(mocks.redirect).toHaveBeenCalledWith(destination);
      expect(mocks.headers).not.toHaveBeenCalled();
    },
  );

  it("keeps the Clerk sign-in flow for a signed-out viewer", async () => {
    mocks.getMarketingViewer.mockResolvedValue({
      role: null,
      userId: null,
    });

    const page = await SignInPage({ searchParams: Promise.resolve({}) });

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(mocks.headers).toHaveBeenCalledTimes(1);
    expect(page.type).toBe("main");
  });
});
