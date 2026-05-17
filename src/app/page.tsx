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
  },
  {
    title: "Partner Dashboard",
    href: "/dashboard/partner",
    icon: Building2,
  },
  {
    title: "Staff Dashboard",
    href: "/dashboard/staff",
    icon: Users,
  },
  {
    title: "Admin Dashboard",
    href: "/dashboard/admin",
    icon: ShieldCheck,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground sm:px-10">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col justify-center gap-12">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Future Physicians
          </p>
          <h1 className="text-4xl font-semibold tracking-normal sm:text-6xl">
            FP Dashboard
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Healthcare opportunity placement infrastructure for Future
            Physicians
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dashboards.map((dashboard) => {
            const Icon = dashboard.icon;

            return (
              <Link
                className="group flex min-h-36 flex-col justify-between rounded-lg border border-border bg-muted/50 p-5 transition hover:border-primary hover:bg-muted"
                href={dashboard.href}
                key={dashboard.href}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-background text-primary">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </div>
                <div className="mt-8 flex items-center justify-between gap-4">
                  <span className="text-base font-medium">
                    {dashboard.title}
                  </span>
                  <ArrowRight
                    aria-hidden="true"
                    className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
