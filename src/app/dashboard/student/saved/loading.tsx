export default function SavedOpportunitiesLoading() {
  return (
    <div aria-busy="true" aria-live="polite" role="status">
      <p className="sr-only">Loading saved opportunities.</p>
      <div aria-hidden="true" className="space-y-4">
        {["one", "two", "three"].map((item) => (
          <div
            className="h-40 rounded-xl border border-border bg-muted/40 motion-safe:animate-pulse"
            key={item}
          />
        ))}
      </div>
    </div>
  );
}
