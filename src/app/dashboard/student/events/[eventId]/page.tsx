import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { prisma } from "@/lib/db/prisma";
import {
  canRegisterForEvent,
  formatEventDate,
  formatEventLabel,
} from "@/lib/events/events";
import { assertStudentAccess } from "@/lib/student/authorization";
import { getStudentNavItems } from "@/lib/student/navigation";
import { getCurrentStudentProfile } from "@/lib/student/profile";

import {
  cancelProgramEventRegistration,
  registerForProgramEvent,
} from "../../../events/actions";

export default async function StudentEventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const { userId } = await assertStudentAccess();
  const user = await getCurrentStudentProfile(userId);
  const studentProfileId = user.studentProfile?.id;

  const event = await prisma.programEvent.findFirst({
    where: {
      id: eventId,
      status: "PUBLISHED",
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

  if (!event) {
    notFound();
  }

  const registration = event.registrations.at(0);
  const canRegister = canRegisterForEvent(event);

  return (
    <DashboardShell
      navItems={getStudentNavItems("/dashboard/student/events")}
      role="student"
    >
      <div className="space-y-8">
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-muted"
          href="/dashboard/student/events"
        >
          Back to events
        </Link>

        <article className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-muted text-primary">
            <CalendarDays aria-hidden="true" className="h-5 w-5" />
          </div>
          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            {formatEventLabel(event.eventType)}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
            {event.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            {event.description || "Details are coming soon."}
          </p>

          <dl className="mt-6 grid gap-4 text-sm text-muted-foreground md:grid-cols-2">
            <Fact label="Starts" value={formatEventDate(event.startAt)} />
            <Fact label="Ends" value={formatEventDate(event.endAt)} />
            <Fact label="Location" value={event.location || "Not set"} />
            <Fact label="Virtual link" value={event.virtualLink || "Not set"} />
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
            <Fact
              label="Speakers"
              value={
                event.speakerNames.length > 0
                  ? event.speakerNames.join(", ")
                  : "Not set"
              }
            />
            <Fact
              label="Your status"
              value={
                registration
                  ? formatEventLabel(registration.status)
                  : "Not registered"
              }
            />
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
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
                  value={`/dashboard/student/events/${event.id}`}
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
                  value={`/dashboard/student/events/${event.id}`}
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
        </article>
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
