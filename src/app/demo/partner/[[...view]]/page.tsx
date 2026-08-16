import { PartnerDemo } from "@/components/demo/partner-demo";
import { requireValidDemoSession } from "@/lib/demo/recruiter-session";

export const dynamic = "force-dynamic";

export default async function PartnerDemoPage({
  params,
}: {
  params: Promise<{ view?: string[] }>;
}) {
  await requireValidDemoSession();
  const { view = [] } = await params;
  return <PartnerDemo view={view} />;
}
