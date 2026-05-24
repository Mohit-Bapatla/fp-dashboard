import "server-only";

import type {
  CertificateStatus,
  ServiceHourVerificationStatus,
} from "@/generated/prisma/enums";

export type ServiceHourRecordView = {
  certificateNotes: string | null;
  certificateStatus: CertificateStatus;
  description: string | null;
  hours: number;
  id: string;
  verificationNotes: string | null;
  verificationStatus: ServiceHourVerificationStatus;
  verifiedAt: Date | null;
};

export function formatServiceHourStatus(
  status: CertificateStatus | ServiceHourVerificationStatus,
) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
