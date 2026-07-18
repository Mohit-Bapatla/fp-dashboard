type ClerkEmailAddressLike = {
  emailAddress: string;
  verification?: {
    status?: string | null;
  } | null;
};

type ClerkUserEmailLike = {
  emailAddresses: readonly ClerkEmailAddressLike[];
  primaryEmailAddress?: ClerkEmailAddressLike | null;
};

function isVerifiedEmailAddress(
  emailAddress: ClerkEmailAddressLike | null | undefined,
) {
  return emailAddress?.verification?.status === "verified";
}

/**
 * Returns a verified Clerk email, preferring the verified primary address.
 * Unverified addresses must never become organization contact information.
 */
export function getVerifiedClerkEmailAddress(
  user: ClerkUserEmailLike | null | undefined,
) {
  if (!user) {
    return null;
  }

  if (isVerifiedEmailAddress(user.primaryEmailAddress)) {
    return user.primaryEmailAddress?.emailAddress ?? null;
  }

  return user.emailAddresses.find(isVerifiedEmailAddress)?.emailAddress ?? null;
}
