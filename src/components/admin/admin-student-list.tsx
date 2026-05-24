import { GraduationCap, Search } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";

export type AdminStudentListItem = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: Date;
  studentProfile: {
    school: string | null;
    gradeYear: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    completionPercent: number;
    resumeCount: number;
    applicationCount: number;
  } | null;
};

type AdminStudentListProps = {
  students: AdminStudentListItem[];
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(value);
}

function getStudentName(student: AdminStudentListItem) {
  const name = [student.firstName, student.lastName].filter(Boolean).join(" ");

  return name || student.email;
}

function getLocation(student: AdminStudentListItem) {
  const profile = student.studentProfile;

  if (!profile) {
    return "Not provided";
  }

  return (
    [profile.city, profile.state, profile.country].filter(Boolean).join(", ") ||
    "Not provided"
  );
}

function Detail({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function AdminStudentList({ students }: AdminStudentListProps) {
  if (students.length === 0) {
    return (
      <EmptyState
        description="No student records match the current search. Clear the search to return to the full student list."
        icon={Search}
        title="No students found"
      />
    );
  }

  return (
    <div className="grid gap-4">
      {students.map((student) => (
        <article
          className="rounded-lg border border-border bg-background p-5 shadow-sm"
          key={student.id}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted text-primary">
                <GraduationCap aria-hidden="true" className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-xl font-semibold tracking-normal text-foreground">
                {getStudentName(student)}
              </h2>
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                {student.email}
              </p>
            </div>
            <div className="rounded-full border border-border bg-muted/50 px-3 py-1 text-sm font-medium text-muted-foreground">
              Created {formatDate(student.createdAt)}
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Detail
              label="School"
              value={student.studentProfile?.school ?? "Not provided"}
            />
            <Detail
              label="Grade year"
              value={student.studentProfile?.gradeYear ?? "Not provided"}
            />
            <Detail label="Location" value={getLocation(student)} />
            <Detail
              label="Profile completion"
              value={
                student.studentProfile
                  ? `${student.studentProfile.completionPercent}%`
                  : "0%"
              }
            />
            <Detail
              label="Resume status"
              value={
                student.studentProfile?.resumeCount
                  ? `${student.studentProfile.resumeCount} uploaded`
                  : "Missing"
              }
            />
            <Detail
              label="Applications"
              value={student.studentProfile?.applicationCount ?? 0}
            />
          </div>
        </article>
      ))}
    </div>
  );
}
