import type { OpportunityType } from "@/generated/prisma/enums";
import type { ReactNode } from "react";
import Link from "next/link";
import type { StudentOpportunityFilters } from "@/lib/student/opportunity-filters";
import { studentOpportunityTypeOptions } from "@/lib/student/opportunity-filters";

type StudentOpportunityFilterOptions = {
  specialties: string[];
  remoteTypes: string[];
  paidStatuses: string[];
  locations: string[];
};

type StudentOpportunityFiltersProps = {
  filters: StudentOpportunityFilters;
  options: StudentOpportunityFilterOptions;
};

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function StudentOpportunityFilters({
  filters,
  options,
}: StudentOpportunityFiltersProps) {
  return (
    <section className="rounded-lg border border-border bg-background p-5 shadow-sm">
      <form className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_repeat(5,minmax(0,0.8fr))_120px] lg:items-end">
        <label className="text-sm font-medium text-foreground">
          Search
          <input
            className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-foreground"
            defaultValue={filters.q}
            name="q"
            placeholder="Search title, specialty, location, or partner"
          />
        </label>

        <SelectField label="Type" name="type" value={filters.type}>
          <option value="">All types</option>
          {studentOpportunityTypeOptions.map((type: OpportunityType) => (
            <option key={type} value={type}>
              {formatEnumLabel(type)}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Specialty"
          name="specialty"
          value={filters.specialty}
        >
          <option value="">All specialties</option>
          {options.specialties.map((specialty) => (
            <option key={specialty} value={specialty}>
              {specialty}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Format"
          name="remoteType"
          value={filters.remoteType}
        >
          <option value="">Any format</option>
          {options.remoteTypes.map((remoteType) => (
            <option key={remoteType} value={remoteType}>
              {remoteType}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Paid status"
          name="paidStatus"
          value={filters.paidStatus}
        >
          <option value="">Any status</option>
          {options.paidStatuses.map((paidStatus) => (
            <option key={paidStatus} value={paidStatus}>
              {paidStatus}
            </option>
          ))}
        </SelectField>

        <SelectField label="Location" name="location" value={filters.location}>
          <option value="">All locations</option>
          {options.locations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </SelectField>

        <SelectField label="Sort" name="sort" value={filters.sort}>
          <option value="recent">Recently added</option>
          <option value="deadline">Deadline</option>
        </SelectField>

        <div className="flex gap-3 lg:col-span-full">
          <button
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            type="submit"
          >
            Apply filters
          </button>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted"
            href="/dashboard/student/opportunities"
          >
            Clear
          </Link>
        </div>
      </form>
    </section>
  );
}

type SelectFieldProps = {
  children: ReactNode;
  label: string;
  name: string;
  value: string;
};

function SelectField({ children, label, name, value }: SelectFieldProps) {
  return (
    <label className="text-sm font-medium text-foreground">
      {label}
      <select
        className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-foreground"
        defaultValue={value}
        name={name}
      >
        {children}
      </select>
    </label>
  );
}
