import { RoleDashboardPage } from "@/components/dashboard/role-dashboard-page";

export default function StaffDashboardPage() {
  return (
    <RoleDashboardPage
      role="staff"
      title="Staff Dashboard"
      description="Coordinate partner outreach, maintain contacts, triage tasks, and support placement workflows across students and organizations."
      stats={[
        {
          label: "Partner contacts",
          value: "118",
          helper: "Placeholder contact book for staff relationship tracking.",
        },
        {
          label: "Open tasks",
          value: "17",
          helper: "Future follow-ups, reminders, and review work.",
        },
        {
          label: "Placement queue",
          value: "22",
          helper: "Requests staff will coordinate across roles.",
        },
        {
          label: "Outreach touches",
          value: "44",
          helper: "Recent outreach activity once logging is available.",
        },
      ]}
    />
  );
}
