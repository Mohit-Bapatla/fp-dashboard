import Link from "next/link";

type DashboardPlaceholderProps = {
  title: string;
  description: string;
};

export function DashboardPlaceholder({
  title,
  description,
}: DashboardPlaceholderProps) {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground sm:px-10">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-4xl flex-col justify-center">
        <Link
          className="mb-10 inline-flex items-center rounded text-sm font-medium text-primary transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          href="/"
        >
          FP Dashboard
        </Link>
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          Coming soon
        </p>
        <h1 className="text-4xl font-semibold tracking-normal sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
          {description}
        </p>
      </section>
    </main>
  );
}
