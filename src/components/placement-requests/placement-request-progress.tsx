import type { PlacementRequestStatus } from "@/generated/prisma/enums";
import {
  formatEnumLabel,
  placementRequestStatusOptions,
} from "@/lib/placement-requests/validation";

type PlacementRequestProgressProps = {
  status: PlacementRequestStatus;
};

export function PlacementRequestProgress({
  status,
}: PlacementRequestProgressProps) {
  const currentIndex = placementRequestStatusOptions.indexOf(status);

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
      {placementRequestStatusOptions.map((option, index) => {
        const isComplete = currentIndex >= index;
        const isCurrent = option === status;

        return (
          <div
            className={[
              "rounded-md border px-3 py-2 text-xs font-medium",
              isCurrent
                ? "border-primary bg-primary/10 text-primary"
                : isComplete
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-border bg-muted/30 text-muted-foreground",
            ].join(" ")}
            key={option}
          >
            {formatEnumLabel(option)}
          </div>
        );
      })}
    </div>
  );
}
