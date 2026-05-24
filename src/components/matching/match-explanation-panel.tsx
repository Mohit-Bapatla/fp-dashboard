import type { MatchExplanation } from "@/lib/matching/explanations";

type MatchExplanationPanelProps = {
  explanation: MatchExplanation;
};

function ExplanationList({
  empty,
  items,
  title,
}: {
  empty: string;
  items: string[];
  title: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-2 text-sm leading-6 text-muted-foreground">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{empty}</p>
      )}
    </div>
  );
}

export function MatchExplanationPanel({
  explanation,
}: MatchExplanationPanelProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ExplanationList
        empty="No matched preferences were found yet."
        items={explanation.matchedPreferences}
        title="Matched preferences"
      />
      <ExplanationList
        empty="No resume skill overlap was found yet."
        items={explanation.matchedSkills}
        title="Matched skills"
      />
      <ExplanationList
        empty="No major missing requirements were detected."
        items={explanation.missingRequirements}
        title="Missing requirements"
      />
      <ExplanationList
        empty="Keep your profile and parsed resume current."
        items={explanation.improvementTips}
        title="How to improve fit"
      />
    </div>
  );
}
