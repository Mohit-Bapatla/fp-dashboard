import type { EligibilityCategory } from "@/lib/matching/opportunity-eligibility";

const labels: Record<EligibilityCategory, string> = { STRONG_MATCH: "Strong Match", POSSIBLE_MATCH: "Possible Match", NOT_ELIGIBLE: "Not Eligible" };
export function EligibilityBadge({ category }: { category: EligibilityCategory }) {
  const color = category === "STRONG_MATCH" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : category === "NOT_ELIGIBLE" ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-800";
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${color}`}>{labels[category]}</span>;
}
