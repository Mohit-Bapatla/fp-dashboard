"use client";

import { useState } from "react";

export function WorkspacePrivateNotesField({
  initialValue,
}: {
  initialValue: string;
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <textarea
      className="mt-2 w-full rounded-lg border border-border bg-background p-3"
      maxLength={10000}
      name="privateNotes"
      onChange={(event) => setValue(event.target.value)}
      rows={5}
      value={value}
    />
  );
}
