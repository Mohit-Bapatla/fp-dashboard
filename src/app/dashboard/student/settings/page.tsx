import { AccountSettingsForm } from "@/components/dashboard/account-settings-form";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RoleBadge } from "@/components/dashboard/role-badge";
import { StudentNotificationPreferencesForm } from "@/components/student/student-notification-preferences-form";
import { StudentWeeklyPlanPreview } from "@/components/student/student-weekly-plan-preview";
import { assertStudentAccess } from "@/lib/student/authorization";
import { getStudentNotificationPreference } from "@/lib/student/notification-preferences";
import { getCurrentStudentProfile } from "@/lib/student/profile";
import { getStudentWeeklyPlan } from "@/lib/student/weekly-plan";
import { getStudentNavItems } from "@/lib/student/navigation";

export default async function StudentSettingsPage() {
  const { userId } = await assertStudentAccess();
  const user = await getCurrentStudentProfile(userId);
  const notificationPreference = user.studentProfile
    ? await getStudentNotificationPreference(user.studentProfile.id)
    : null;
  const weeklyPlan =
    user.studentProfile && notificationPreference
      ? await getStudentWeeklyPlan({
          studentProfileId: user.studentProfile.id,
          timezone: notificationPreference.timezone,
        })
      : null;

  return (
    <DashboardShell
      navItems={getStudentNavItems("/dashboard/student/settings")}
      role="student"
    >
      <div className="space-y-8">
        <header className="rounded-xl border border-border bg-background p-6 shadow-sm">
          <RoleBadge className="mb-5" role="student" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Account settings
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground">
            Settings
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            Manage your display name, planning reminders, email preferences,
            timezone, and weekly action summary.
          </p>
        </header>

        <AccountSettingsForm
          email={user.email}
          firstName={user.firstName ?? ""}
          lastName={user.lastName ?? ""}
        />

        {notificationPreference ? (
          <StudentNotificationPreferencesForm values={notificationPreference} />
        ) : (
          <StudentNotificationPreferencesForm
            disabled
            values={{
              deadlineAlertsEnabled: true,
              emailEnabled: false,
              inAppEnabled: true,
              interviewReminderEnabled: true,
              openingAlertsEnabled: true,
              outcomeReminderEnabled: true,
              quietHoursEnd: "07:00",
              quietHoursStart: "22:00",
              recommendationReminderEnabled: true,
              taskReminderEnabled: true,
              timezone: "America/Chicago",
              weeklyDigestEnabled: false,
            }}
          />
        )}

        {weeklyPlan ? <StudentWeeklyPlanPreview plan={weeklyPlan} /> : null}
      </div>
    </DashboardShell>
  );
}
