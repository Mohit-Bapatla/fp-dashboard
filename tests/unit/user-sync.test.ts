import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  currentUser: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  currentUser: mocks.currentUser,
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      create: mocks.create,
      findUnique: mocks.findUnique,
      update: mocks.update,
    },
  },
}));

import { syncCurrentUserFromClerk } from "@/lib/auth/user-sync";

describe("Clerk user synchronization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.currentUser.mockResolvedValue({
      emailAddresses: [],
      firstName: "Avery",
      lastName: "Ng",
      primaryEmailAddress: { emailAddress: "avery@example.org" },
    });
  });

  it("does not overwrite an established database role from a session claim", async () => {
    mocks.findUnique.mockResolvedValue({
      firstName: "Avery",
      lastName: "Ng",
    });
    mocks.update.mockResolvedValue({ id: "database-user" });

    await syncCurrentUserFromClerk({
      clerkUserId: "clerk-user",
      preserveExistingRole: true,
      role: "STUDENT",
    });

    expect(mocks.update).toHaveBeenCalledWith({
      where: { clerkUserId: "clerk-user" },
      data: {
        email: "avery@example.org",
        firstName: undefined,
        lastName: undefined,
        role: undefined,
      },
    });
  });

  it("keeps existing role propagation for established authorization flows", async () => {
    mocks.findUnique.mockResolvedValue({
      firstName: "Avery",
      lastName: "Ng",
    });
    mocks.update.mockResolvedValue({ id: "database-user" });

    await syncCurrentUserFromClerk({
      clerkUserId: "clerk-user",
      role: "ADMIN",
    });

    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: "ADMIN" }),
      }),
    );
  });

  it("uses the session role only when initializing a new database user", async () => {
    mocks.findUnique.mockResolvedValue(null);
    mocks.create.mockResolvedValue({ id: "database-user" });

    await syncCurrentUserFromClerk({
      clerkUserId: "clerk-user",
      role: "PARTNER",
    });

    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        clerkUserId: "clerk-user",
        role: "PARTNER",
      }),
    });
  });
});
