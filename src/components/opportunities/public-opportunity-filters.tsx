import { SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";

import {
  gradeLevelCodes,
  formatGradeLevelCode,
} from "@/lib/matching/grade-levels";
import type { EligibilityCategory } from "@/lib/matching/opportunity-eligibility";
import { studentOpportunityTypeOptions } from "@/lib/student/opportunity-filters";
import type { PublicOpportunityFilterOptions } from "@/lib/public/opportunities";

import { formatOpportunityEnum } from "./public-opportunity-card";

export type PublicOpportunityFilterValues = {
  applicationMethod: string;
  availabilityStatus: string;
  deadline: string;
  eligibility: EligibilityCategory | "";
  grade: string;
  location: string;
  paidStatus: string;
  q: string;
  remoteType: string;
  sort: string;
  specialty: string;
  type: string;
};

const inputClass =
  "min-h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-brand-navy outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15";

function FilterFields({
  filters,
  options,
  showEligibility,
}: {
  filters: PublicOpportunityFilterValues;
  options: PublicOpportunityFilterOptions;
  showEligibility: boolean;
}) {
  return (
    <>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-brand-navy">
          Search
        </span>
        <input
          className={inputClass}
          defaultValue={filters.q}
          maxLength={120}
          name="q"
          placeholder="Title, organization, or keyword"
          type="search"
        />
      </label>

      <FilterSelect label="Opportunity type" name="type" value={filters.type}>
        {studentOpportunityTypeOptions.map((type) => (
          <option key={type} value={type}>
            {formatOpportunityEnum(type)}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect
        label="Specialty"
        name="specialty"
        value={filters.specialty}
      >
        {options.specialties.map((specialty) => (
          <option key={specialty} value={specialty}>
            {specialty}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect label="Format" name="remoteType" value={filters.remoteType}>
        {options.remoteTypes.map((remoteType) => (
          <option key={remoteType} value={remoteType}>
            {remoteType}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect label="Location" name="location" value={filters.location}>
        {options.locations.map((location) => (
          <option key={location} value={location}>
            {location}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect
        label="Grade / education level"
        name="grade"
        value={filters.grade}
      >
        {gradeLevelCodes.map((grade) => (
          <option key={grade} value={grade}>
            {formatGradeLevelCode(grade)}
          </option>
        ))}
      </FilterSelect>

      {showEligibility ? (
        <FilterSelect
          label="My eligibility check"
          name="eligibility"
          value={filters.eligibility}
        >
          <option value="STRONG_MATCH">Strong match</option>
          <option value="POSSIBLE_MATCH">Possible match</option>
          <option value="NOT_ELIGIBLE">May not qualify</option>
        </FilterSelect>
      ) : null}

      <FilterSelect
        label="Compensation"
        name="paidStatus"
        value={filters.paidStatus}
      >
        {options.paidStatuses.map((paidStatus) => (
          <option key={paidStatus} value={paidStatus}>
            {paidStatus}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect label="Deadline" name="deadline" value={filters.deadline}>
        <option value="30-days">Next 30 days</option>
        <option value="60-days">Next 60 days</option>
        <option value="90-days">Next 90 days</option>
        <option value="rolling">Rolling applications</option>
      </FilterSelect>

      <FilterSelect
        label="Application method"
        name="applicationMethod"
        value={filters.applicationMethod}
      >
        <option value="EXTERNAL_PORTAL">External application</option>
        <option value="FP_INTERNAL">Apply through FP</option>
        <option value="FP_REFERRAL">FP introduction</option>
      </FilterSelect>

      <FilterSelect
        label="Availability"
        name="availabilityStatus"
        value={filters.availabilityStatus}
      >
        <option value="OPEN">Open</option>
        <option value="OPENING_SOON">Opening soon</option>
        <option value="ROLLING">Rolling</option>
      </FilterSelect>

      <FilterSelect label="Sort by" name="sort" value={filters.sort}>
        <option value="newest">Newest</option>
        <option value="deadline">Earliest deadline</option>
        <option value="recently-verified">Recently verified</option>
      </FilterSelect>
    </>
  );
}

function FilterSelect({
  children,
  label,
  name,
  value,
}: {
  children: React.ReactNode;
  label: string;
  name: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-brand-navy">
        {label}
      </span>
      <select className={inputClass} defaultValue={value} name={name}>
        <option value="">All</option>
        {children}
      </select>
    </label>
  );
}

function FilterForm({
  filters,
  options,
  showEligibility,
}: {
  filters: PublicOpportunityFilterValues;
  options: PublicOpportunityFilterOptions;
  showEligibility: boolean;
}) {
  return (
    <form action="/opportunities" className="space-y-5" method="get">
      <FilterFields
        filters={filters}
        options={options}
        showEligibility={showEligibility}
      />
      <div className="flex flex-col gap-2 pt-1">
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          type="submit"
        >
          Apply filters
        </button>
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-brand-navy transition hover:bg-blue-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          href="/opportunities"
        >
          <X aria-hidden="true" className="size-4" />
          Reset filters
        </Link>
      </div>
    </form>
  );
}

export function PublicOpportunityFilters({
  filters,
  options,
  resultCount,
  showEligibility = false,
}: {
  filters: PublicOpportunityFilterValues;
  options: PublicOpportunityFilterOptions;
  resultCount: number;
  showEligibility?: boolean;
}) {
  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => Boolean(value) && !(key === "sort" && value === "newest"),
  ).length;

  return (
    <div>
      <details className="rounded-2xl border border-border bg-white shadow-sm lg:hidden">
        <summary className="flex min-h-14 list-none items-center justify-between gap-4 rounded-2xl px-5 text-sm font-semibold text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal
              aria-hidden="true"
              className="size-4 text-primary"
            />
            Search and filters
          </span>
          <span className="rounded-full bg-blue-surface px-2.5 py-1 text-xs text-primary">
            {activeFilterCount > 0
              ? `${activeFilterCount} active`
              : `${resultCount} ${resultCount === 1 ? "result" : "results"}`}
          </span>
        </summary>
        <div className="border-t border-border p-5">
          <FilterForm
            filters={filters}
            options={options}
            showEligibility={showEligibility}
          />
        </div>
      </details>

      <aside
        aria-label="Opportunity filters"
        className="sticky top-24 hidden rounded-2xl border border-border bg-white p-5 shadow-sm lg:block"
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-brand-navy">
            <SlidersHorizontal
              aria-hidden="true"
              className="size-4 text-primary"
            />
            Search and filters
          </h2>
          {activeFilterCount > 0 ? (
            <span className="rounded-full bg-blue-surface px-2.5 py-1 text-xs font-semibold text-primary">
              {activeFilterCount}
            </span>
          ) : null}
        </div>
        <FilterForm
          filters={filters}
          options={options}
          showEligibility={showEligibility}
        />
      </aside>
    </div>
  );
}
