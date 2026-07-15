"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";

import { Prisma } from "@/generated/prisma/client";
import { acquireAccountTransitionLock } from "@/lib/auth/account-transition";
import { getVerifiedClerkEmailAddress } from "@/lib/auth/clerk-email";
import { getAppRole, getRoleFromSessionClaims } from "@/lib/auth/roles";
import { syncCurrentUserFromClerk } from "@/lib/auth/user-sync";
import { createAuditLog } from "@/lib/audit/audit-log";
import { prisma } from "@/lib/db/prisma";
import { logServerError } from "@/lib/monitoring/logger";
import {
  getPartnerOnboardingBlockReason,
  partnerOnboardingBlockMessage,
  PARTNER_ONBOARDING_PATH,
  type PartnerOnboardingActionState,
  validatePartnerOnboardingForm,
  withPartnerPublicMetadata,
} from "@/lib/partner/onboarding";
import {
  enforceRateLimit,
  formatRateLimitMessage,
} from "@/lib/security/rate-limit";
import { siteConfig } from "@/lib/site-config";

class PartnerOnboardingFlowError extends Error {
  constructor(
    readonly code: "ACCOUNT_BLOCKED" | "ORGANIZATION_EXISTS",
    message: string,
  ) {
    super(message);
    this.name = "PartnerOnboardingFlowError";
  }
}

function errorState(
  values: PartnerOnboardingActionState["values"],
  formError: string,
  fieldErrors: PartnerOnboardingActionState["fieldErrors"] = {},
): PartnerOnboardingActionState {
  return {
    fieldErrors,
    formError,
    status: "idle",
    values,
  };
}

export async function createPartnerWorkspace(
  _previousState: PartnerOnboardingActionState,
  formData: FormData,
): Promise<PartnerOnboardingActionState> {
  const { redirectToSignIn, sessionClaims, userId } = await auth();

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: PARTNER_ONBOARDING_PATH });
  }

  const validation = validatePartnerOnboardingForm(formData);

  if (!validation.success) {
    return errorState(
      validation.values,
      "Please fix the highlighted fields.",
      validation.errors,
    );
  }

  const rateLimit = await enforceRateLimit({
    action: "partner_self_onboarding",
    identifier: `clerk:${userId}`,
    limit: 5,
    windowSeconds: 60 * 60,
  });

  if (!rateLimit.allowed) {
    return errorState(validation.values, formatRateLimitMessage(rateLimit));
  }

  const client = await clerkClient();
  let clerkUser;

  try {
    clerkUser = await client.users.getUser(userId);
  } catch (error) {
    logServerError(
      "Could not load Clerk user during partner onboarding.",
      error,
      {
        clerkUserId: userId,
      },
    );
    return errorState(
      validation.values,
      "We could not verify your account. Please try again before creating a workspace.",
    );
  }

  const contactEmail = getVerifiedClerkEmailAddress(clerkUser);

  if (!contactEmail) {
    return errorState(
      validation.values,
      "Add and verify an email address on your account before creating a partner workspace.",
    );
  }

  const sessionRole = getRoleFromSessionClaims(sessionClaims);
  const clerkRole = getAppRole(clerkUser.publicMetadata?.role);
  const existingAccount = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      partnerMemberships: { select: { id: true }, take: 1 },
      role: true,
      studentProfile: { select: { id: true } },
    },
  });
  const initialBlockReason = getPartnerOnboardingBlockReason({
    clerkRole,
    databaseRole: existingAccount?.role ?? null,
    hasPartnerMembership: Boolean(existingAccount?.partnerMemberships.length),
    hasStudentProfile: Boolean(existingAccount?.studentProfile),
    sessionRole,
  });

  if (initialBlockReason) {
    return errorState(
      validation.values,
      partnerOnboardingBlockMessage(initialBlockReason),
    );
  }

  let syncedUser;

  try {
    syncedUser = await syncCurrentUserFromClerk({
      clerkUserId: userId,
      preserveExistingRole: true,
      role: "STUDENT",
    });
  } catch (error) {
    logServerError("Could not sync user during partner onboarding.", error, {
      clerkUserId: userId,
    });
    return errorState(
      validation.values,
      "We could not prepare your account. No partner workspace was created; please try again.",
    );
  }

  let organization: { id: string };

  try {
    organization = await prisma.$transaction(async (transaction) => {
      await acquireAccountTransitionLock(transaction, userId);
      await transaction.$queryRaw`
        SELECT pg_advisory_xact_lock(
          hashtext(${`partner-onboarding:organization:${validation.data.normalizedName}`})
        )
      `;

      const account = await transaction.user.findUnique({
        where: { id: syncedUser.id },
        select: {
          partnerMemberships: { select: { id: true }, take: 1 },
          role: true,
          studentProfile: { select: { id: true } },
        },
      });

      if (!account) {
        throw new PartnerOnboardingFlowError(
          "ACCOUNT_BLOCKED",
          "Your account could not be found after synchronization.",
        );
      }

      const blockReason = getPartnerOnboardingBlockReason({
        clerkRole,
        databaseRole: account.role,
        hasPartnerMembership: account.partnerMemberships.length > 0,
        hasStudentProfile: Boolean(account.studentProfile),
        sessionRole,
      });

      if (blockReason) {
        throw new PartnerOnboardingFlowError(
          "ACCOUNT_BLOCKED",
          partnerOnboardingBlockMessage(blockReason),
        );
      }

      const existingOrganization =
        await transaction.partnerOrganization.findFirst({
          where: {
            name: {
              equals: validation.data.name,
              mode: "insensitive",
            },
          },
          select: { id: true },
        });

      if (existingOrganization) {
        throw new PartnerOnboardingFlowError(
          "ORGANIZATION_EXISTS",
          "An organization with this name already exists. Self-onboarding cannot join or claim an existing organization; contact support for access.",
        );
      }

      const createdOrganization = await transaction.partnerOrganization.create({
        data: {
          contactEmail,
          name: validation.data.name,
          status: "NOT_CONTACTED",
          type: validation.data.organizationType,
          verificationStatus: "UNVERIFIED",
          website: validation.data.website,
          members: {
            create: {
              isPrimary: true,
              title: validation.data.title,
              userId: syncedUser.id,
            },
          },
        },
        select: { id: true },
      });

      await transaction.user.update({
        where: { id: syncedUser.id },
        data: {
          email: contactEmail,
          role: "PARTNER",
        },
      });
      await transaction.auditLog.create({
        data: {
          action: "PARTNER_SELF_ONBOARDING_CREATED",
          actorId: syncedUser.id,
          entityId: createdOrganization.id,
          entityType: "PartnerOrganization",
          metadata: {
            source: "partner_self_onboarding",
            status: "NOT_CONTACTED",
            verificationStatus: "UNVERIFIED",
          },
        },
      });

      return createdOrganization;
    });
  } catch (error) {
    if (error instanceof PartnerOnboardingFlowError) {
      return errorState(
        validation.values,
        error.message,
        error.code === "ORGANIZATION_EXISTS" ? { name: error.message } : {},
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return errorState(
        validation.values,
        "That organization or account was created during this request. No existing organization was claimed; contact support if you need access.",
        {
          name: "An organization with this name may already exist.",
        },
      );
    }

    logServerError("Partner onboarding database transaction failed.", error, {
      clerkUserId: userId,
    });
    return errorState(
      validation.values,
      "We could not create the partner workspace. No account permissions were changed; please try again.",
    );
  }

  try {
    await client.users.updateUserMetadata(userId, {
      publicMetadata: withPartnerPublicMetadata(clerkUser.publicMetadata),
    });
  } catch (error) {
    logServerError(
      "Partner workspace was created but Clerk role activation failed.",
      error,
      {
        clerkUserId: userId,
        organizationId: organization.id,
      },
    );

    try {
      await createAuditLog({
        action: "PARTNER_SELF_ONBOARDING_ACTIVATION_FAILED",
        actorId: syncedUser.id,
        entityId: organization.id,
        entityType: "PartnerOrganization",
        metadata: {
          source: "partner_self_onboarding",
          supportRequired: true,
        },
      });
    } catch (auditError) {
      logServerError(
        "Could not audit partial partner onboarding activation.",
        auditError,
        { clerkUserId: userId, organizationId: organization.id },
      );
    }

    return {
      fieldErrors: {},
      formError: `Your unverified workspace was saved, but account activation did not finish. Do not resubmit this form. Email ${siteConfig.emails.support} so the team can complete the role sync.`,
      status: "activation_pending",
      values: validation.values,
    };
  }

  return {
    fieldErrors: {},
    formError: null,
    status: "complete",
    values: validation.values,
  };
}
