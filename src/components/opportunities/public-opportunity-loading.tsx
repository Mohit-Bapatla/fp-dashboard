import { MarketingContainer } from "@/components/marketing/page-shell";

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className}`} />;
}

export function PublicOpportunityDirectorySkeleton() {
  return (
    <div aria-busy="true" role="status">
      <span className="sr-only">Loading opportunities</span>
      <section className="border-b border-border bg-white py-14 sm:py-16">
        <MarketingContainer>
          <SkeletonBlock className="h-4 w-36" />
          <SkeletonBlock className="mt-5 h-12 max-w-2xl" />
          <SkeletonBlock className="mt-4 h-6 max-w-xl" />
        </MarketingContainer>
      </section>
      <MarketingContainer className="py-10 sm:py-12">
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="hidden h-[620px] animate-pulse rounded-2xl border border-border bg-white lg:block" />
          <div>
            <SkeletonBlock className="h-6 w-40" />
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {Array.from({ length: 6 }, (_, index) => (
                <div
                  className="rounded-2xl border border-border bg-white p-6"
                  key={index}
                >
                  <div className="flex gap-2">
                    <SkeletonBlock className="h-6 w-28" />
                    <SkeletonBlock className="h-6 w-20" />
                  </div>
                  <SkeletonBlock className="mt-6 h-4 w-32" />
                  <SkeletonBlock className="mt-3 h-8 w-4/5" />
                  <SkeletonBlock className="mt-3 h-4 w-full" />
                  <SkeletonBlock className="mt-2 h-4 w-3/4" />
                  <div className="mt-6 space-y-3">
                    <SkeletonBlock className="h-4 w-4/5" />
                    <SkeletonBlock className="h-4 w-full" />
                    <SkeletonBlock className="h-4 w-2/3" />
                  </div>
                  <SkeletonBlock className="mt-7 h-11 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </MarketingContainer>
    </div>
  );
}
