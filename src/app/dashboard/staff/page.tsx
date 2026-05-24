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
          value: "—",
          helper: "Partner contacts will appear as outreach records are added.",
        },
        {
          label: "Open tasks",
          value: "—",
          helper: "Open tasks and follow-ups across your partner pipeline.",
        },
        {
          label: "Placement queue",
          value: "—",
          helper: "Active placement requests being coordinated for students.",
        },
        {
          label: "Outreach touches",
          value: "—",
          helper: "Outreach touches logged across partner contacts.",
        },
      ]}
    />
  );
}
