import { RoleDashboardPage } from "@/components/dashboard/role-dashboard-page";

export default function StudentDashboardPage() {
  return (
    <RoleDashboardPage
      role="student"
      title="Student Dashboard"
      description="Discover healthcare opportunities, track applications, save roles of interest, and follow placement request progress from one student workspace."
      stats={[
        {
          label: "Open opportunities",
          value: "24",
          helper: "Placeholder count for opportunities students will browse.",
        },
        {
          label: "Applications",
          value: "6",
          helper:
            "Draft, submitted, and reviewed applications will appear here.",
        },
        {
          label: "Placement requests",
          value: "3",
          helper: "Future requests awaiting staff or partner coordination.",
        },
        {
          label: "Saved roles",
          value: "12",
          helper: "Opportunities marked for later review.",
        },
      ]}
    />
  );
}
