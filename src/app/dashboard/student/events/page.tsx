import { CalendarDays } from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { prisma } from "@/lib/db/prisma";
import {
  canRegisterForEvent,
  formatEventDate,
  formatEventLabel,
} from "@/lib/events/events";
import { getStudentNavItems } from "@/lib/student/navigation";
import { assertStudentAccess } from "@/lib/student/authorization";
import { getCurrentStudentProfile } from "@/lib/student/profile";

import {
  cancelProgramEventRegistration,
  registerForProgramEvent,
} from "../../events/actions";

export default async function StudentEventsPage() {
  const { userId } = await assertStudentAccess();
  const user = await getCurrentStudentProfile(userId);
  const studentProfileId = user.studentProfile?.id;

  const events = await prisma.programEvent.findMany({
    where: {
      status: "PUBLISHED",
    },
    orderBy: {
      startAt: "asc",
    },
    include: {
      registrations: {
        where: {
          studentProfileId: studentProfileId ?? "__missing__",
        },
      },
      _count: {
        select: {
          registrations: {
            where: {
              status: {
                in: ["REGISTERED", "ATTENDED"],
              },
            },
          },
        },
      },
    },
  });
  const upcomingCount = events.filter(
    (event) => event.startAt > new Date(),
  ).length;
  const registeredCount = events.filter((event) =>
    event.registrations.some((registration) =>
      ["REGISTERED", "WAITLISTED", "ATTENDED"].includes(registration.status),
    ),
  ).length;

  return (
    <DashboardShell
      navItems={getStudentNavItems("/dashboard/student/events")}
      role="student"
    >
      <div className="space-y-8">
        <header className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-muted text-primary">
            <CalendarDays aria-hidden="true" className="h-5 w-5" />
          </div>
          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Events
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
            Program Events
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            Browse seminars, workshops, panels, and Future Physicians events
            open for student registration.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            helper="Published events currently available to view."
            label="Published events"
            value={events.length.toString()}
          />
          <StatCard
            helper="Published events with a future start time."
            label="Upcoming"
            value={upcomingCount.toString()}
          />
          <StatCard
            helper="Events where you have an active registration or attendance record."
            label="Your events"
            value={registeredCount.toString()}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {events.length === 0 ? (
            <article className="rounded-lg border border-border bg-background p-6 text-sm text-muted-foreground shadow-sm">
              Published events will appear here when staff opens registration.
            </article>
          ) : (
            events.map((event) => {
              const registration = event.registrations.at(0);
              const canRegister = canRegisterForEvent(event);

              return (
                <article
                  className="rounded-lg border border-border bg-background p-6 shadow-sm"
                  key={event.id}
                >
                  <p className="text-sm font-medium text-primary">
                    {formatEventLabel(event.eventType)}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-foreground">
                    {event.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {event.description || "Details are coming soon."}
                  </p>
                  <dl className="mt-4 grid gap-3 text-sm text-muted-foreground">
                    <Fact
                      label="Starts"
                      value={formatEventDate(event.startAt)}
                    />
                    <Fact
                      label="Location"
                      value={event.location || "Not set"}
                    />
                    <Fact
                      label="Registration deadline"
                      value={formatEventDate(event.registrationDeadline)}
                    />
                    <Fact
                      label="Capacity"
                      value={
                        event.capacity
                          ? `${event._count.registrations}/${event.capacity}`
                          : "Unlimited"
                      }
                    />
                  </dl>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                      href={`/dashboard/student/events/${event.id}`}
                    >
                      View details
                    </Link>
                    {registration?.status === "REGISTERED" ||
                    registration?.status === "WAITLISTED" ? (
                      <form action={cancelProgramEventRegistration}>
                        <input
                          name="registrationId"
                          type="hidden"
                          value={registration.id}
                        />
                        <input
                          name="redirectTo"
                          type="hidden"
                          value="/dashboard/student/events"
                        />
                        <button
                          className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                          type="submit"
                        >
                          Cancel registration
                        </button>
                      </form>
                    ) : (
                      <form action={registerForProgramEvent}>
                        <input name="eventId" type="hidden" value={event.id} />
                        <input
                          name="redirectTo"
                          type="hidden"
                          value="/dashboard/student/events"
                        />
                        <button
                          className="inline-flex min-h-10 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background shadow-sm transition hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={!canRegister}
                          type="submit"
                        >
                          Register
                        </button>
                      </form>
                    )}
                  </div>
                  {registration ? (
                    <p className="mt-3 text-sm font-medium text-muted-foreground">
                      Status: {formatEventLabel(registration.status)}
                    </p>
                  ) : null}
                </article>
              );
            })
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-medium text-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
