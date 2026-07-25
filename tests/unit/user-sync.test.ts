import { beforeEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";

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
      primaryEmailAddress: {
        emailAddress: "avery@example.org",
        verification: { status: "verified" },
      },
    });
  });

  it("does not overwrite an established database role from a session claim", async () => {
    mocks.findUnique.mockResolvedValue({
      clerkUserId: "clerk-user",
      firstName: "Avery",
      id: "database-user",
      lastName: "Ng",
    });
    mocks.update.mockResolvedValue({ id: "database-user" });

    await syncCurrentUserFromClerk({
      clerkUserId: "clerk-user",
      preserveExistingRole: true,
      role: "STUDENT",
    });

    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "database-user" },
      data: {
        clerkUserId: undefined,
        email: "avery@example.org",
        firstName: undefined,
        lastName: undefined,
        role: undefined,
      },
    });
  });

  it("keeps existing role propagation for established authorization flows", async () => {
    mocks.findUnique.mockResolvedValue({
      clerkUserId: "clerk-user",
      firstName: "Avery",
      id: "database-user",
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

  it("links a verified Clerk identity to the existing user with the same email", async () => {
    mocks.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
      clerkUserId: "legacy-clerk-user",
      firstName: "Avery",
      id: "database-user",
      lastName: "Ng",
    });
    mocks.update.mockResolvedValue({ id: "database-user" });

    await syncCurrentUserFromClerk({
      clerkUserId: "current-clerk-user",
      role: "ADMIN",
    });

    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.findUnique).toHaveBeenNthCalledWith(2, {
      where: { email: "avery@example.org" },
      select: expect.objectContaining({ id: true }),
    });
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "database-user" },
      data: expect.objectContaining({
        clerkUserId: "current-clerk-user",
        email: "avery@example.org",
        role: "ADMIN",
      }),
    });
  });

  it("does not claim an existing account through an unverified email", async () => {
    mocks.currentUser.mockResolvedValue({
      emailAddresses: [],
      firstName: "Avery",
      lastName: "Ng",
      primaryEmailAddress: {
        emailAddress: "avery@example.org",
        verification: { status: "unverified" },
      },
    });
    mocks.findUnique.mockResolvedValue(null);
    mocks.create.mockResolvedValue({ id: "database-user" });

    await syncCurrentUserFromClerk({
      clerkUserId: "clerk-user",
      role: "STUDENT",
    });

    expect(mocks.findUnique).toHaveBeenCalledTimes(1);
    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: "clerk-user@example.invalid",
      }),
    });
  });

  it("reuses the row created by a concurrent first request", async () => {
    mocks.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        clerkUserId: "clerk-user",
        firstName: "Avery",
        id: "database-user",
        lastName: "Ng",
      });
    mocks.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        clientVersion: "7.8.0",
        code: "P2002",
      }),
    );
    mocks.update.mockResolvedValue({ id: "database-user" });

    await expect(
      syncCurrentUserFromClerk({
        clerkUserId: "clerk-user",
        role: "STUDENT",
      }),
    ).resolves.toEqual({ id: "database-user" });

    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "database-user" } }),
    );
  });
});
