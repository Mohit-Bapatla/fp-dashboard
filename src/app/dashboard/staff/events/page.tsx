import { EventManagementPage } from "@/app/dashboard/events/event-management-page";
import { assertPlacementQueueAccess } from "@/lib/placement-requests/authorization";
import { getStaffNavItems } from "@/lib/staff/navigation";

export default async function StaffEventsPage() {
  await assertPlacementQueueAccess();

  return (
    <EventManagementPage
      activeHref="/dashboard/staff/events"
      navItems={getStaffNavItems("/dashboard/staff/events")}
      role="staff"
      title="Staff Events"
    />
  );
}
