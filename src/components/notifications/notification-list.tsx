import { BellRing, Check, CheckCheck } from "lucide-react";

import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/app/dashboard/notifications/actions";

type NotificationListItem = {
  body: string | null;
  createdAt: Date;
  id: string;
  readAt: Date | null;
  title: string;
};

type NotificationListProps = {
  notifications: NotificationListItem[];
  unreadCount: number;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function NotificationList({
  notifications,
  unreadCount,
}: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <section className="rounded-lg border border-border bg-background p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-border bg-muted text-primary">
          <BellRing aria-hidden="true" className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-lg font-semibold text-foreground">
          No notifications
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Workflow updates for your role will appear here after activity starts.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-background shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Recent notifications
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount} unread
          </p>
        </div>
        {unreadCount > 0 ? (
          <form action={markAllNotificationsRead}>
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
              type="submit"
            >
              <CheckCheck aria-hidden="true" className="h-4 w-4" />
              Mark all read
            </button>
          </form>
        ) : null}
      </div>
      <div className="divide-y divide-border">
        {notifications.map((notification) => (
          <article
            className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between"
            key={notification.id}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {notification.title}
                </h3>
                {!notification.readAt ? (
                  <span className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                    New
                  </span>
                ) : null}
              </div>
              {notification.body ? (
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {notification.body}
                </p>
              ) : null}
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                {formatDate(notification.createdAt)}
              </p>
            </div>
            {!notification.readAt ? (
              <form action={markNotificationRead}>
                <input
                  name="notificationId"
                  type="hidden"
                  value={notification.id}
                />
                <button
                  className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                  type="submit"
                >
                  <Check aria-hidden="true" className="h-4 w-4" />
                  Mark read
                </button>
              </form>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
