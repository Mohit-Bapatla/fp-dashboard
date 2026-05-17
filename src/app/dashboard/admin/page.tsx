import { RoleDashboardPage } from "@/components/dashboard/role-dashboard-page";

export default function AdminDashboardPage() {
  return (
    <RoleDashboardPage
      role="admin"
      title="Admin Dashboard"
      description="Oversee users, role-level data, platform configuration, audit activity, and operational health for the FP Dashboard."
      stats={[
        {
          label: "Total users",
          value: "256",
          helper:
            "Placeholder platform user count before authentication exists.",
        },
        {
          label: "Students",
          value: "184",
          helper: "Future student records visible to platform administrators.",
        },
        {
          label: "Partners",
          value: "42",
          helper: "Partner organizations represented in later data stages.",
        },
        {
          label: "Audit events",
          value: "0",
          helper: "Reserved for compliance and change history tracking.",
        },
      ]}
    />
  );
}
