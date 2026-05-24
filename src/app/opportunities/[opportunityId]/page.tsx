import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicOpportunityPreview } from "@/components/public/public-opportunity-preview";
import { getPublicOpportunity } from "@/lib/public/opportunities";

type PublicOpportunityPageProps = {
  params: Promise<{
    opportunityId: string;
  }>;
};

function metadataDescription(value: string | null) {
  if (!value) {
    return "View this Future Physicians opportunity preview and sign in to apply.";
  }

  return value.length > 155 ? `${value.slice(0, 152).trim()}...` : value;
}

export async function generateMetadata({
  params,
}: PublicOpportunityPageProps): Promise<Metadata> {
  const { opportunityId } = await params;
  const opportunity = await getPublicOpportunity(opportunityId);

  if (!opportunity) {
    return {
      title: "Opportunity not found | Future Physicians",
    };
  }

  return {
    description: metadataDescription(opportunity.description),
    title: `${opportunity.title} | Future Physicians`,
  };
}

export default async function PublicOpportunityPage({
  params,
}: PublicOpportunityPageProps) {
  const { opportunityId } = await params;
  const opportunity = await getPublicOpportunity(opportunityId);

  if (!opportunity) {
    notFound();
  }

  return <PublicOpportunityPreview opportunity={opportunity} />;
}
