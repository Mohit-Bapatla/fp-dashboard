import { RoleDashboardPage } from "@/components/dashboard/role-dashboard-page";

export default function PartnerDashboardPage() {
  return (
    <RoleDashboardPage
      role="partner"
      title="Partner Dashboard"
      description="Manage organization details, publish healthcare opportunities, review applicants, and monitor placement activity for partner teams."
      stats={[
        {
          label: "Active opportunities",
          value: "8",
          helper: "Placeholder inventory for partner-owned opportunities.",
        },
        {
          label: "Applicants",
          value: "31",
          helper: "Future applicant queue for partner review.",
        },
        {
          label: "Pending requests",
          value: "5",
          helper: "Placement requests waiting on coordination details.",
        },
        {
          label: "Profile health",
          value: "72%",
          helper: "Organization completeness indicator for a later stage.",
        },
      ]}
    />
  );
}
