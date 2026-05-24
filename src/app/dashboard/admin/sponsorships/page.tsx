import { SponsorshipsManagementPage } from "@/app/dashboard/sponsorships/sponsorships-management-page";
import { assertAdminAccess } from "@/lib/admin/authorization";
import { getAdminNavItems } from "@/lib/admin/navigation";

export default async function AdminSponsorshipsPage() {
  await assertAdminAccess();

  return (
    <SponsorshipsManagementPage
      activeHref="/dashboard/admin/sponsorships"
      navItems={getAdminNavItems("/dashboard/admin/sponsorships")}
      role="admin"
      title="Sponsorships"
    />
  );
}
