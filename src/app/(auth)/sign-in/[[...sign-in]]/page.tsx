import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="mb-8 text-center">
        <Link
          className="inline-block rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          href="/"
        >
          <span className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Future Physicians
          </span>
        </Link>
        <h1 className="mt-3 text-xl font-semibold text-foreground">
          Welcome back
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Access your FP Dashboard — manage opportunities, applications, and
          placements.
        </p>
      </div>
      <SignIn
        fallbackRedirectUrl="/dashboard"
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
      />
    </main>
  );
}
