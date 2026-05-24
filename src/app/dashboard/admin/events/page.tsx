import { EventManagementPage } from "@/app/dashboard/events/event-management-page";
import { assertAdminAccess } from "@/lib/admin/authorization";
import { getAdminNavItems } from "@/lib/admin/navigation";

export default async function AdminEventsPage() {
  await assertAdminAccess();

  return (
    <EventManagementPage
      activeHref="/dashboard/admin/events"
      navItems={getAdminNavItems("/dashboard/admin/events")}
      role="admin"
      title="Events"
    />
  );
}
