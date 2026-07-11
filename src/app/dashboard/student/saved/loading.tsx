export default function SavedOpportunitiesLoading() {
  return (
    <div className="space-y-4" aria-label="Loading saved opportunities">
      {[1, 2, 3].map((item) => (
        <div
          className="h-40 animate-pulse rounded-xl border border-border bg-muted/40"
          key={item}
        />
      ))}
    </div>
  );
}
