export default function DashboardLoading() {
  return (
    <main
      aria-label="Dashboard"
      className="min-h-screen bg-page px-4 py-6 text-foreground sm:px-6 lg:px-8"
    >
      <div
        aria-busy="true"
        aria-live="polite"
        className="mx-auto w-full max-w-[1280px]"
        role="status"
      >
        <p className="sr-only">Loading dashboard.</p>
        <div aria-hidden="true" className="space-y-6">
          <div className="rounded-2xl border border-border bg-background p-5 shadow-sm sm:p-6">
            <div className="h-3 w-28 rounded-full bg-primary/15 motion-safe:animate-pulse" />
            <div className="mt-4 h-9 w-full max-w-sm rounded-lg bg-muted motion-safe:animate-pulse" />
            <div className="mt-3 h-4 w-full max-w-2xl rounded-full bg-muted/70 motion-safe:animate-pulse" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {["one", "two", "three", "four"].map((item) => (
              <div
                className="h-32 rounded-2xl border border-border bg-background shadow-sm motion-safe:animate-pulse"
                key={item}
              />
            ))}
          </div>
          <div className="h-72 rounded-2xl border border-border bg-background shadow-sm motion-safe:animate-pulse" />
        </div>
      </div>
    </main>
  );
}
