import { PlacementRequestQueuePage } from "@/components/placement-requests/placement-request-queue-page";

type StaffPlacementRequestsPageProps = {
  searchParams: Promise<{
    assignedStaffId?: string;
    priority?: string;
    q?: string;
    status?: string;
  }>;
};

export default async function StaffPlacementRequestsPage({
  searchParams,
}: StaffPlacementRequestsPageProps) {
  return (
    <PlacementRequestQueuePage
      activeHref="/dashboard/staff/placement-requests"
      dashboardRole="staff"
      description="Triage personalized student placement requests, assign staff owners, update research progress, and maintain internal notes."
      searchParams={await searchParams}
      title="Placement Requests"
    />
  );
}
