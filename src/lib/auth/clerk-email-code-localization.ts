import type { LocalizationResource } from "@clerk/nextjs/types";

export const EMAIL_CODE_DELIVERY_HELP =
  "Didn’t receive the code? Check your Spam or Promotions folder for an email from notifications@futurephysicians.org. Mark it as ‘Not spam’ so future codes reach your inbox.";

export const clerkEmailCodeLocalization = {
  reverification: {
    emailCode: {
      subtitle: EMAIL_CODE_DELIVERY_HELP,
    },
  },
  signIn: {
    emailCode: {
      subtitle: EMAIL_CODE_DELIVERY_HELP,
    },
    emailCodeMfa: {
      subtitle: EMAIL_CODE_DELIVERY_HELP,
    },
    forgotPassword: {
      subtitle_email: EMAIL_CODE_DELIVERY_HELP,
    },
  },
  signUp: {
    emailCode: {
      formSubtitle: EMAIL_CODE_DELIVERY_HELP,
    },
  },
} satisfies LocalizationResource;
