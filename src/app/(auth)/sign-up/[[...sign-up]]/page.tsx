import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
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
          Create your account
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Join Future Physicians — discover healthcare opportunities and track
          placement progress.
        </p>
      </div>
      <SignUp
        fallbackRedirectUrl="/dashboard"
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
      />
    </main>
  );
}
