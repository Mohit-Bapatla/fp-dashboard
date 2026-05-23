import "server-only";

import { Resend } from "resend";

export type TransactionalEmailInput = {
  html?: string;
  subject: string;
  text: string;
  to: string | string[];
};

export type TransactionalEmailResult = {
  error?: string;
  reason?: string;
  sent: boolean;
  skipped: boolean;
};

let resendClient: Resend | null = null;

function getResendClient(apiKey: string) {
  resendClient ??= new Resend(apiKey);

  return resendClient;
}

function getRecipients(to: string | string[]) {
  const recipients = Array.isArray(to) ? to : [to];

  return recipients
    .map((recipient) => recipient.trim())
    .filter((recipient) => recipient.length > 0);
}

export async function sendTransactionalEmail({
  html,
  subject,
  text,
  to,
}: TransactionalEmailInput): Promise<TransactionalEmailResult> {
  const recipients = getRecipients(to);

  if (recipients.length === 0) {
    return {
      reason: "missing_recipient",
      sent: false,
      skipped: true,
    };
  }

  if (process.env.EMAIL_NOTIFICATIONS_ENABLED !== "true") {
    return {
      reason: "email_disabled",
      sent: false,
      skipped: true,
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return {
      reason: "missing_email_configuration",
      sent: false,
      skipped: true,
    };
  }

  try {
    const resend = getResendClient(apiKey);
    const replyTo = process.env.EMAIL_REPLY_TO?.trim();
    const result = await resend.emails.send({
      from,
      html,
      replyTo: replyTo || undefined,
      subject,
      text,
      to: recipients,
    });

    if (result.error) {
      return {
        error: result.error.message,
        sent: false,
        skipped: false,
      };
    }

    return {
      sent: true,
      skipped: false,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unknown email error",
      sent: false,
      skipped: false,
    };
  }
}
