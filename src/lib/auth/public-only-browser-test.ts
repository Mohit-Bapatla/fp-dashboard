/**
 * Keep the signed-out public-site seam exclusive to GitHub Actions browser
 * tests. Vercel exposes its own environment markers, so a copied test flag
 * cannot suppress a real Clerk session in Preview or Production.
 */
type PublicOnlyBrowserTestEnvironment = Record<string, string | undefined>;

export function isPublicOnlyBrowserTest(
  environment: PublicOnlyBrowserTestEnvironment = process.env,
) {
  return (
    environment.E2E_PUBLIC_ONLY === "true" &&
    environment.CI === "true" &&
    environment.GITHUB_ACTIONS === "true" &&
    environment.VERCEL === undefined &&
    environment.VERCEL_ENV === undefined
  );
}
