import { SponsorshipsManagementPage } from "@/app/dashboard/sponsorships/sponsorships-management-page";
import { assertPlacementQueueAccess } from "@/lib/placement-requests/authorization";
import { getStaffNavItems } from "@/lib/staff/navigation";

export default async function StaffSponsorshipsPage() {
  await assertPlacementQueueAccess();

  return (
    <SponsorshipsManagementPage
      activeHref="/dashboard/staff/sponsorships"
      navItems={getStaffNavItems("/dashboard/staff/sponsorships")}
      role="staff"
      title="Sponsorships"
    />
  );
}
