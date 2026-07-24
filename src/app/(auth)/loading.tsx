export default function AuthLoading() {
  return (
    <main
      aria-busy="true"
      className="flex min-h-screen items-center justify-center bg-background px-4"
      id="auth-main"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-background p-8 text-center shadow-sm"
        role="status"
      >
        <div
          aria-hidden="true"
          className="mx-auto size-8 animate-spin rounded-full border-2 border-primary/25 border-t-primary"
        />
        <p className="mt-4 text-sm font-medium text-foreground">
          Loading secure sign-in…
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Keep this page open while the account form loads.
        </p>
      </div>
    </main>
  );
}
