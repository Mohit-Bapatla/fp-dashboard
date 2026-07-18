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

export function applicationTaskOwnership(
  studentProfileId: string,
  taskId: string,
) {
  return {
    id: taskId,
    application: {
      studentProfileId,
    },
  } as const;
}
