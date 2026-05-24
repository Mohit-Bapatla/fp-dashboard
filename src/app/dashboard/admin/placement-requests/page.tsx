import { PlacementRequestQueuePage } from "@/components/placement-requests/placement-request-queue-page";

type AdminPlacementRequestsPageProps = {
  searchParams: Promise<{
    assignedStaffId?: string;
    priority?: string;
    q?: string;
    status?: string;
  }>;
};

export default async function AdminPlacementRequestsPage({
  searchParams,
}: AdminPlacementRequestsPageProps) {
  return (
    <PlacementRequestQueuePage
      activeHref="/dashboard/admin/placement-requests"
      dashboardRole="admin"
      description="Monitor the full personalized placement queue, assign staff owners, update priority, and track request progress."
      searchParams={await searchParams}
      title="Placement Requests"
    />
  );
}
