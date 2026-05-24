import { CalendarDays, Plus } from "lucide-react";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type {
  DashboardNavItem,
  DashboardRole,
} from "@/components/dashboard/role-config";
import { StatCard } from "@/components/dashboard/stat-card";
import { prisma } from "@/lib/db/prisma";
import {
  formatEventDate,
  formatEventLabel,
  programEventStatuses,
  programEventTypes,
} from "@/lib/events/events";

import { saveProgramEvent, updateEventAttendance } from "./actions";

type EventManagementPageProps = {
  activeHref: string;
  navItems: DashboardNavItem[];
  role: DashboardRole;
  title: string;
};

export async function EventManagementPage({
  activeHref,
  navItems,
  role,
  title,
}: EventManagementPageProps) {
  const [events, publishedCount, registrationCount] = await Promise.all([
    prisma.programEvent.findMany({
      orderBy: [
        {
          startAt: "asc",
        },
      ],
      include: {
        registrations: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            studentProfile: {
              select: {
                user: {
                  select: {
                    email: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.programEvent.count({
      where: {
        status: "PUBLISHED",
      },
    }),
    prisma.eventRegistration.count({
      where: {
        status: {
          in: ["REGISTERED", "WAITLISTED", "ATTENDED"],
        },
      },
    }),
  ]);

  return (
    <DashboardShell navItems={navItems} role={role}>
      <div className="space-y-8">
        <header className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-muted text-primary">
            <CalendarDays aria-hidden="true" className="h-5 w-5" />
          </div>
          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Program events
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            Create seminars and program events, monitor registrations, and
            record attendance without external ticketing or calendar tools.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            helper="All event records across draft, published, and archived statuses."
            label="Events"
            value={events.length.toString()}
          />
          <StatCard
            helper="Events currently visible to students."
            label="Published"
            value={publishedCount.toString()}
          />
          <StatCard
            helper="Active registrations, waitlist entries, and attended records."
            label="Registrations"
            value={registrationCount.toString()}
          />
        </section>

        <section className="rounded-lg border border-border bg-background p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted text-primary">
              <Plus aria-hidden="true" className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Create event
              </h2>
              <p className="text-sm text-muted-foreground">
                New events default to draft unless you choose published.
              </p>
            </div>
          </div>
          <EventForm redirectTo={activeHref} />
        </section>

        <section className="space-y-4">
          {events.length === 0 ? (
            <article className="rounded-lg border border-border bg-background p-6 text-sm text-muted-foreground shadow-sm">
              Events will appear here after staff or admins create them.
            </article>
          ) : (
            events.map((event) => (
              <article
                className="rounded-lg border border-border bg-background p-6 shadow-sm"
                key={event.id}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary">
                      {formatEventLabel(event.eventType)} |{" "}
                      {formatEventLabel(event.status)}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-foreground">
                      {event.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {event.description || "No description yet."}
                    </p>
                    <dl className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                      <Fact
                        label="Starts"
                        value={formatEventDate(event.startAt)}
                      />
                      <Fact label="Ends" value={formatEventDate(event.endAt)} />
                      <Fact
                        label="Location"
                        value={event.location || "Not set"}
                      />
                      <Fact
                        label="Virtual link"
                        value={event.virtualLink || "Not set"}
                      />
                      <Fact
                        label="Registration deadline"
                        value={formatEventDate(event.registrationDeadline)}
                      />
                      <Fact
                        label="Capacity"
                        value={event.capacity?.toString() ?? "Unlimited"}
                      />
                    </dl>
                  </div>
                </div>

                <details className="mt-6 rounded-lg border border-border p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-foreground">
                    Edit event
                  </summary>
                  <EventForm
                    event={{
                      capacity: event.capacity,
                      description: event.description,
                      endAt: event.endAt,
                      eventType: event.eventType,
                      id: event.id,
                      location: event.location,
                      registrationDeadline: event.registrationDeadline,
                      speakerNames: event.speakerNames,
                      startAt: event.startAt,
                      status: event.status,
                      title: event.title,
                      virtualLink: event.virtualLink,
                    }}
                    redirectTo={activeHref}
                  />
                </details>

                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-foreground">
                    Registrants
                  </h3>
                  {event.registrations.length === 0 ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      No registrations yet.
                    </p>
                  ) : (
                    <div className="mt-3 overflow-hidden rounded-lg border border-border">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-muted text-muted-foreground">
                          <tr>
                            <th className="px-4 py-3 font-medium">Student</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">
                              Attendance
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {event.registrations.map((registration) => (
                            <tr key={registration.id}>
                              <td className="px-4 py-3">
                                <p className="font-medium text-foreground">
                                  {getStudentName(registration.studentProfile)}
                                </p>
                                <p className="text-muted-foreground">
                                  {registration.studentProfile.user.email}
                                </p>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {formatEventLabel(registration.status)}
                              </td>
                              <td className="px-4 py-3">
                                <form
                                  action={updateEventAttendance}
                                  className="flex flex-wrap gap-2"
                                >
                                  <input
                                    name="registrationId"
                                    type="hidden"
                                    value={registration.id}
                                  />
                                  <input
                                    name="redirectTo"
                                    type="hidden"
                                    value={activeHref}
                                  />
                                  <button
                                    className="inline-flex min-h-9 items-center justify-center rounded-md border border-border px-3 text-xs font-medium text-foreground transition hover:bg-muted"
                                    name="status"
                                    type="submit"
                                    value="ATTENDED"
                                  >
                                    Attended
                                  </button>
                                  <button
                                    className="inline-flex min-h-9 items-center justify-center rounded-md border border-border px-3 text-xs font-medium text-foreground transition hover:bg-muted"
                                    name="status"
                                    type="submit"
                                    value="NO_SHOW"
                                  >
                                    No show
                                  </button>
                                </form>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </DashboardShell>
  );
}

function EventForm({
  event,
  redirectTo,
}: {
  event?: {
    capacity: number | null;
    description: string | null;
    endAt: Date | null;
    eventType: string;
    id: string;
    location: string | null;
    registrationDeadline: Date | null;
    speakerNames: string[];
    startAt: Date;
    status: string;
    title: string;
    virtualLink: string | null;
  };
  redirectTo: string;
}) {
  return (
    <form action={saveProgramEvent} className="mt-6 grid gap-4 lg:grid-cols-2">
      <input name="eventId" type="hidden" value={event?.id ?? ""} />
      <input name="redirectTo" type="hidden" value={redirectTo} />
      <Field label="Title">
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          defaultValue={event?.title ?? ""}
          name="title"
          required
        />
      </Field>
      <Field label="Type">
        <select
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          defaultValue={event?.eventType ?? "OTHER"}
          name="eventType"
        >
          {programEventTypes.map((type) => (
            <option key={type} value={type}>
              {formatEventLabel(type)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Status">
        <select
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          defaultValue={event?.status ?? "DRAFT"}
          name="status"
        >
          {programEventStatuses.map((status) => (
            <option key={status} value={status}>
              {formatEventLabel(status)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Start">
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          defaultValue={formatInputDate(event?.startAt)}
          name="startAt"
          required
          type="datetime-local"
        />
      </Field>
      <Field label="End">
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          defaultValue={formatInputDate(event?.endAt)}
          name="endAt"
          type="datetime-local"
        />
      </Field>
      <Field label="Registration deadline">
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          defaultValue={formatInputDate(event?.registrationDeadline)}
          name="registrationDeadline"
          type="datetime-local"
        />
      </Field>
      <Field label="Location">
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          defaultValue={event?.location ?? ""}
          name="location"
        />
      </Field>
      <Field label="Virtual link">
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          defaultValue={event?.virtualLink ?? ""}
          name="virtualLink"
          type="url"
        />
      </Field>
      <Field label="Capacity">
        <input
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          defaultValue={event?.capacity ?? ""}
          min="1"
          name="capacity"
          type="number"
        />
      </Field>
      <Field label="Speaker names, one per line">
        <textarea
          className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          defaultValue={event?.speakerNames.join("\n") ?? ""}
          name="speakerNames"
        />
      </Field>
      <div className="lg:col-span-2">
        <Field label="Description">
          <textarea
            className="min-h-28 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            defaultValue={event?.description ?? ""}
            name="description"
          />
        </Field>
      </div>
      <div className="lg:col-span-2">
        <button
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background shadow-sm transition hover:bg-foreground/90"
          type="submit"
        >
          {event ? "Save event" : "Create event"}
        </button>
      </div>
    </form>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="block text-sm font-medium text-foreground">
      {label}
      <span className="mt-2 block">{children}</span>
    </label>
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

function getStudentName(profile: {
  user: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}) {
  const name = [profile.user.firstName, profile.user.lastName]
    .filter(Boolean)
    .join(" ");

  return name || profile.user.email;
}

function formatInputDate(value?: Date | null) {
  if (!value) {
    return "";
  }

  const offset = value.getTimezoneOffset();
  const local = new Date(value.getTime() - offset * 60_000);

  return local.toISOString().slice(0, 16);
}
