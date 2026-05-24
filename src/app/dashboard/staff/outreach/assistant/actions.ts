"use server";

import { createOutreachDraft } from "@/lib/ai/outreach-draft";
import { prisma } from "@/lib/db/prisma";
import { assertPlacementQueueAccess } from "@/lib/placement-requests/authorization";
import {
  enforceRateLimit,
  formatRateLimitMessage,
} from "@/lib/security/rate-limit";
import { outreachTemplateTypes } from "@/lib/staff/outreach-assistant-options";

export type OutreachAssistantState = {
  body: string;
  error: string | null;
  subject: string;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export async function generateOutreachDraft(
  _previousState: OutreachAssistantState,
  formData: FormData,
): Promise<OutreachAssistantState> {
  const { userId } = await assertPlacementQueueAccess();
  const rateLimit = await enforceRateLimit({
    action: "ai_outreach_draft",
    identifier: userId,
    limit: 20,
    windowSeconds: 60 * 60,
  });

  if (!rateLimit.allowed) {
    return {
      body: "",
      error: formatRateLimitMessage(rateLimit),
      subject: "",
    };
  }

  const templateType = getString(formData, "templateType");

  if (!outreachTemplateTypes.includes(templateType as never)) {
    return {
      body: "",
      error: "Choose a draft template.",
      subject: "",
    };
  }

  const organizationId = getString(formData, "organizationId");
  const contactId = getString(formData, "contactId");
  const placementRequestId = getString(formData, "placementRequestId");
  const [organization, contact, placementRequest] = await Promise.all([
    organizationId
      ? prisma.partnerOrganization.findUnique({
          where: { id: organizationId },
          select: { name: true, specialtyAreas: true },
        })
      : Promise.resolve(null),
    contactId
      ? prisma.outreachContact.findUnique({
          where: { id: contactId },
          select: { firstName: true, lastName: true },
        })
      : Promise.resolve(null),
    placementRequestId
      ? prisma.placementRequest.findUnique({
          where: { id: placementRequestId },
          select: {
            requestedSpecialties: true,
            title: true,
          },
        })
      : Promise.resolve(null),
  ]);
  const contactName = contact
    ? [contact.firstName, contact.lastName].filter(Boolean).join(" ")
    : "";
  const specialty =
    getString(formData, "specialty") ||
    placementRequest?.requestedSpecialties.at(0) ||
    organization?.specialtyAreas.at(0) ||
    "";
  const draft = await createOutreachDraft({
    contactName,
    extraNotes: getString(formData, "extraNotes"),
    organizationName: organization?.name,
    placementRequestTitle: placementRequest?.title,
    specialty,
    templateType: templateType as (typeof outreachTemplateTypes)[number],
  });

  return {
    body: draft.body,
    error: null,
    subject: draft.subject,
  };
}
