import { StudentDemo } from "@/components/demo/student-demo";
import { requireValidDemoSession } from "@/lib/demo/recruiter-session";

export const dynamic = "force-dynamic";

export default async function StudentDemoPage({
  params,
}: {
  params: Promise<{ view?: string[] }>;
}) {
  await requireValidDemoSession();
  const { view = [] } = await params;
  return <StudentDemo view={view} />;
}
