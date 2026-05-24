import "server-only";

import { createStructuredJsonResponse } from "@/lib/ai/openai";
import {
  formatOutreachTemplateType,
  type OutreachTemplateType,
} from "@/lib/staff/outreach-assistant-options";

export type OutreachDraftInput = {
  contactName?: string;
  extraNotes?: string;
  organizationName?: string;
  placementRequestTitle?: string;
  specialty?: string;
  templateType: OutreachTemplateType;
};

export type OutreachDraft = {
  body: string;
  subject: string;
};

type AiDraft = {
  body: string;
  subject: string;
};

const draftSchema = {
  additionalProperties: false,
  properties: {
    body: { type: "string" },
    subject: { type: "string" },
  },
  required: ["subject", "body"],
  type: "object",
};

function greeting(contactName?: string) {
  return contactName ? `Hi ${contactName},` : "Hello,";
}

function contextLine(input: OutreachDraftInput) {
  const parts = [
    input.specialty ? `${input.specialty} opportunities` : null,
    input.placementRequestTitle
      ? `a current placement request: ${input.placementRequestTitle}`
      : null,
  ].filter(Boolean);

  return parts.length > 0
    ? ` I am reaching out about ${parts.join(" and ")}.`
    : "";
}

export function createTemplateOutreachDraft(
  input: OutreachDraftInput,
): OutreachDraft {
  const organization = input.organizationName || "your organization";
  const notes = input.extraNotes
    ? `\n\nAdditional context: ${input.extraNotes}`
    : "";
  const baseClose =
    "\n\nWould you be open to a brief conversation about potential collaboration?\n\nBest,\nFuture Physicians Team";
  const intro = `${greeting(input.contactName)}\n\nI hope you are doing well. I am with Future Physicians, a program helping students explore healthcare careers through thoughtful partner opportunities.`;

  if (input.templateType === "THANK_YOU_EMAIL") {
    return {
      body: `${greeting(input.contactName)}\n\nThank you for taking the time to connect with Future Physicians. We appreciate ${organization}'s support for students exploring healthcare careers.${notes}\n\nBest,\nFuture Physicians Team`,
      subject: `Thank you from Future Physicians`,
    };
  }

  if (input.templateType === "FOLLOW_UP_EMAIL") {
    return {
      body: `${intro}${contextLine(input)} I wanted to follow up and see whether there may be a good next step for ${organization}.${notes}${baseClose}`,
      subject: `Following up with ${organization}`,
    };
  }

  if (input.templateType === "CLINIC_SHADOWING_REQUEST") {
    return {
      body: `${intro}${contextLine(input)} We are looking for clinic shadowing pathways where students can observe patient care, professionalism, and day-to-day clinical teamwork in an appropriate setting.${notes}${baseClose}`,
      subject: `Clinic shadowing partnership with Future Physicians`,
    };
  }

  if (input.templateType === "RESEARCH_LAB_REQUEST") {
    return {
      body: `${intro}${contextLine(input)} We are exploring research or lab exposure opportunities for motivated students interested in healthcare, public health, and biomedical careers.${notes}${baseClose}`,
      subject: `Research opportunity collaboration with Future Physicians`,
    };
  }

  if (input.templateType === "VOLUNTEER_OPPORTUNITY_REQUEST") {
    return {
      body: `${intro}${contextLine(input)} We are interested in volunteer opportunities where students can contribute responsibly while learning about healthcare service and community needs.${notes}${baseClose}`,
      subject: `Volunteer opportunity partnership with Future Physicians`,
    };
  }

  return {
    body: `${intro}${contextLine(input)} We would love to learn whether ${organization} might be open to partnering with Future Physicians on student-facing healthcare exploration opportunities.${notes}${baseClose}`,
    subject: `Future Physicians partnership with ${organization}`,
  };
}

export async function createOutreachDraft(
  input: OutreachDraftInput,
): Promise<OutreachDraft> {
  const fallback = createTemplateOutreachDraft(input);
  const aiDraft = await createStructuredJsonResponse<AiDraft>({
    input: [
      "Polish this outreach email draft for Future Physicians staff.",
      "Do not send, schedule, or imply automated follow-up.",
      "Keep the draft editable, professional, concise, and grounded only in provided context.",
      `Template type: ${formatOutreachTemplateType(input.templateType)}`,
      `Context: ${JSON.stringify(input)}`,
      `Fallback draft: ${JSON.stringify(fallback)}`,
    ].join("\n\n"),
    schema: draftSchema,
    schemaName: "outreach_draft",
  });

  return aiDraft?.subject && aiDraft.body ? aiDraft : fallback;
}
