import {
  ArrowRight,
  Building2,
  GraduationCap,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";

const dashboards = [
  {
    title: "Student Dashboard",
    href: "/dashboard/student",
    icon: GraduationCap,
    description: "Discover opportunities, apply, and track your placement progress.",
  },
  {
    title: "Partner Dashboard",
    href: "/dashboard/partner",
    icon: Building2,
    description: "Post opportunities and connect with qualified pre-med students.",
  },
  {
    title: "Staff Dashboard",
    href: "/dashboard/staff",
    icon: Users,
    description: "Coordinate partner outreach, contacts, and placement workflows.",
  },
  {
    title: "Admin Dashboard",
    href: "/dashboard/admin",
    icon: ShieldCheck,
    description: "Oversee platform users, opportunities, and audit operations.",
  },
];

export default function Home() {
  return (
    <>
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-10">
          <span className="text-sm font-semibold text-foreground">
            FP Dashboard
          </span>
          <nav className="flex items-center gap-3">
            <Link
              className="rounded text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              href="/sign-in"
            >
              Sign in
            </Link>
            <Link
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              href="/sign-up"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="bg-background px-6 py-10 text-foreground sm:px-10">
        <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-center gap-12">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Future Physicians
            </p>
            <h1 className="text-4xl font-semibold tracking-normal sm:text-6xl">
              FP Dashboard
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              The placement platform for Future Physicians — connecting students
              with healthcare opportunities, managing partner relationships, and
              tracking outcomes.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {dashboards.map((dashboard) => {
              const Icon = dashboard.icon;

              return (
                <Link
                  className="group flex min-h-40 flex-col justify-between rounded-xl border border-border bg-muted/50 p-5 transition hover:border-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  href={dashboard.href}
                  key={dashboard.href}
                  prefetch={false}
                >
                  <div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-primary">
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </div>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                      {dashboard.description}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <span className="text-base font-medium">
                      {dashboard.title}
                    </span>
                    <ArrowRight
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}
