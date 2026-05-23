import "server-only";

type ApplicationStatusEmailInput = {
  opportunityTitle: string;
  status: string;
  studentName: string;
};

type ApplicationSubmittedEmailInput = {
  opportunityTitle: string;
  organizationName: string;
  studentName: string;
};

type PlacementRequestEmailInput = {
  status?: string;
  title: string;
};

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function applicationSubmittedStudentEmail({
  opportunityTitle,
  organizationName,
}: ApplicationSubmittedEmailInput) {
  const subject = `Application received: ${opportunityTitle}`;
  const text = [
    `Your application for ${opportunityTitle} at ${organizationName} has been received.`,
    "You can track updates from your FP Dashboard applications page.",
  ].join("\n\n");

  return {
    subject,
    text,
  };
}

export function applicationSubmittedReviewerEmail({
  opportunityTitle,
  organizationName,
  studentName,
}: ApplicationSubmittedEmailInput) {
  const subject = `New application: ${opportunityTitle}`;
  const text = [
    `${studentName} submitted an application for ${opportunityTitle} at ${organizationName}.`,
    "Review the application in FP Dashboard.",
  ].join("\n\n");

  return {
    subject,
    text,
  };
}

export function applicationStatusEmail({
  opportunityTitle,
  status,
}: ApplicationStatusEmailInput) {
  const formattedStatus = formatEnum(status);
  const subject = `Application update: ${opportunityTitle}`;
  const text = [
    `Your application for ${opportunityTitle} was updated to ${formattedStatus}.`,
    "Open FP Dashboard to view the latest details.",
  ].join("\n\n");

  return {
    subject,
    text,
  };
}

export function placementRequestStudentEmail({
  status,
  title,
}: PlacementRequestEmailInput) {
  const subject = status
    ? `Placement request update: ${title}`
    : `Placement request received: ${title}`;
  const text = status
    ? `Your placement request "${title}" was updated to ${formatEnum(status)}.`
    : `Your placement request "${title}" has been received.`;

  return {
    subject,
    text,
  };
}

export function placementRequestQueueEmail({
  title,
}: PlacementRequestEmailInput) {
  return {
    subject: `New placement request: ${title}`,
    text: `A new placement request "${title}" was added to the FP Dashboard queue.`,
  };
}

export function outreachTaskAssignedEmail(title: string) {
  return {
    subject: `Outreach task assigned: ${title}`,
    text: `An outreach task "${title}" was assigned to you in FP Dashboard.`,
  };
}
