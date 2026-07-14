export function savedOpportunityOwnership(
  studentProfileId: string,
  opportunityId: string,
) {
  return { studentProfileId, opportunityId } as const;
}

export function applicationOwnership(
  studentProfileId: string,
  applicationId: string,
) {
  return { id: applicationId, studentProfileId } as const;
}
