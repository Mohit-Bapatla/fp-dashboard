type AuditLogListItem = {
  action: string;
  actor: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  createdAt: Date;
  entityId: string | null;
  entityType: string;
  id: string;
  metadata: unknown;
};

type AuditLogListProps = {
  auditLogs: AuditLogListItem[];
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function formatActor(actor: AuditLogListItem["actor"]) {
  if (!actor) {
    return "System";
  }

  const name = [actor.firstName, actor.lastName].filter(Boolean).join(" ");

  return name || actor.email;
}

function formatAction(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatMetadata(value: unknown) {
  if (!value) {
    return "No metadata";
  }

  return JSON.stringify(value, null, 2);
}

export function AuditLogList({ auditLogs }: AuditLogListProps) {
  if (auditLogs.length === 0) {
    return (
      <section className="rounded-lg border border-border bg-background p-8 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">No audit logs</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Successful workflow actions will appear here after they are recorded.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-background shadow-sm">
      <div className="border-b border-border p-5">
        <h2 className="text-lg font-semibold text-foreground">
          Recent audit events
        </h2>
      </div>
      <div className="divide-y divide-border">
        {auditLogs.map((auditLog) => (
          <article
            className="grid gap-4 p-5 lg:grid-cols-[1fr_220px]"
            key={auditLog.id}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {formatAction(auditLog.action)}
                </h3>
                <span className="rounded-md border border-border px-2 py-1 text-xs font-medium text-muted-foreground">
                  {auditLog.entityType}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Actor: {formatActor(auditLog.actor)}
              </p>
              {auditLog.entityId ? (
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  Entity ID: {auditLog.entityId}
                </p>
              ) : null}
              <pre className="mt-3 overflow-x-auto rounded-md border border-border bg-muted p-3 text-xs leading-5 text-muted-foreground">
                {formatMetadata(auditLog.metadata)}
              </pre>
            </div>
            <p className="text-sm font-medium text-muted-foreground lg:text-right">
              {formatDate(auditLog.createdAt)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
