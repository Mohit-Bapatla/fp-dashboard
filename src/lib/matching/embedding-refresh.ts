import "server-only";

import type { EmbeddingEntityType } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import {
  createEmbeddingForText,
  getEmbeddingContentHash,
} from "@/lib/ai/embeddings";
import { prisma } from "@/lib/db/prisma";
import {
  buildOpportunityEmbeddingContent,
  buildPartnerEmbeddingContent,
  buildResumeEmbeddingContent,
  buildStudentProfileEmbeddingContent,
} from "@/lib/matching/embedding-content";

export type EmbeddingRefreshScope = "all" | EmbeddingEntityType;

export type EmbeddingRefreshResult = {
  created: number;
  missing: number;
  skipped: number;
  stale: number;
  unavailable: boolean;
  updated: number;
};

type EmbeddingCandidate = {
  content: string;
  entityId: string;
  entityType: EmbeddingEntityType;
};

function emptyResult(): EmbeddingRefreshResult {
  return {
    created: 0,
    missing: 0,
    skipped: 0,
    stale: 0,
    unavailable: false,
    updated: 0,
  };
}

async function getOpportunityCandidates(): Promise<EmbeddingCandidate[]> {
  const opportunities = await prisma.opportunity.findMany({
    select: {
      applicationInstructions: true,
      description: true,
      eligibilityRequirements: true,
      id: true,
      location: true,
      paidStatus: true,
      remoteType: true,
      specialty: true,
      title: true,
      type: true,
    },
  });

  return opportunities.map((opportunity) => ({
    content: buildOpportunityEmbeddingContent(opportunity),
    entityId: opportunity.id,
    entityType: "OPPORTUNITY",
  }));
}

async function getStudentProfileCandidates(): Promise<EmbeddingCandidate[]> {
  const profiles = await prisma.studentProfile.findMany({
    select: {
      availability: true,
      careerGoals: true,
      id: true,
      interestedSpecialties: true,
      locationPreference: true,
      opportunityTypes: true,
      remotePreference: true,
    },
  });

  return profiles.map((profile) => ({
    content: buildStudentProfileEmbeddingContent(profile),
    entityId: profile.id,
    entityType: "STUDENT_PROFILE",
  }));
}

async function getResumeCandidates(): Promise<EmbeddingCandidate[]> {
  const resumes = await prisma.resume.findMany({
    select: {
      extractedCertifications: true,
      extractedEducation: true,
      extractedExperience: true,
      extractedSkills: true,
      id: true,
      parsedSummary: true,
    },
  });

  return resumes.map((resume) => ({
    content: buildResumeEmbeddingContent(resume),
    entityId: resume.id,
    entityType: "RESUME",
  }));
}

async function getPartnerCandidates(): Promise<EmbeddingCandidate[]> {
  const partners = await prisma.partnerOrganization.findMany({
    select: {
      description: true,
      healthcareFocus: true,
      id: true,
      location: true,
      name: true,
      specialtyAreas: true,
      type: true,
    },
  });

  return partners.map((partner) => ({
    content: buildPartnerEmbeddingContent(partner),
    entityId: partner.id,
    entityType: "PARTNER_ORGANIZATION",
  }));
}

async function getCandidates(scope: EmbeddingRefreshScope) {
  const groups = await Promise.all([
    scope === "all" || scope === "OPPORTUNITY"
      ? getOpportunityCandidates()
      : Promise.resolve([]),
    scope === "all" || scope === "STUDENT_PROFILE"
      ? getStudentProfileCandidates()
      : Promise.resolve([]),
    scope === "all" || scope === "RESUME"
      ? getResumeCandidates()
      : Promise.resolve([]),
    scope === "all" || scope === "PARTNER_ORGANIZATION"
      ? getPartnerCandidates()
      : Promise.resolve([]),
  ]);

  return groups.flat();
}

export async function getEmbeddingCoverage() {
  const candidates = await getCandidates("all");
  const records = await prisma.embeddingRecord.findMany({
    select: {
      contentHash: true,
      entityId: true,
      entityType: true,
    },
  });
  const recordByKey = new Map(
    records.map((record) => [
      `${record.entityType}:${record.entityId}`,
      record.contentHash,
    ]),
  );
  const result = {
    missing: 0,
    stale: 0,
    total: candidates.length,
    upToDate: 0,
  };

  candidates.forEach((candidate) => {
    const hash = getEmbeddingContentHash(candidate.content);
    const currentHash = recordByKey.get(
      `${candidate.entityType}:${candidate.entityId}`,
    );

    if (!currentHash) {
      result.missing += 1;
    } else if (currentHash !== hash) {
      result.stale += 1;
    } else {
      result.upToDate += 1;
    }
  });

  return result;
}

export async function refreshEmbeddings(scope: EmbeddingRefreshScope) {
  const result = emptyResult();
  const candidates = await getCandidates(scope);

  for (const candidate of candidates) {
    const existing = await prisma.embeddingRecord.findUnique({
      where: {
        entityType_entityId: {
          entityId: candidate.entityId,
          entityType: candidate.entityType,
        },
      },
      select: {
        contentHash: true,
      },
    });
    const contentHash = getEmbeddingContentHash(candidate.content);

    if (!existing) {
      result.missing += 1;
    } else if (existing.contentHash !== contentHash) {
      result.stale += 1;
    } else {
      result.skipped += 1;
      continue;
    }

    const embedding = await createEmbeddingForText(candidate.content);

    if (!embedding.available) {
      result.skipped += 1;
      result.unavailable ||= embedding.reason === "missing-api-key";
      continue;
    }

    await prisma.embeddingRecord.upsert({
      where: {
        entityType_entityId: {
          entityId: candidate.entityId,
          entityType: candidate.entityType,
        },
      },
      update: {
        contentHash: embedding.contentHash,
        dimensions: embedding.dimensions,
        embedding: embedding.embedding as Prisma.InputJsonValue,
        model: embedding.model,
      },
      create: {
        contentHash: embedding.contentHash,
        dimensions: embedding.dimensions,
        embedding: embedding.embedding as Prisma.InputJsonValue,
        entityId: candidate.entityId,
        entityType: candidate.entityType,
        model: embedding.model,
      },
    });

    if (existing) {
      result.updated += 1;
    } else {
      result.created += 1;
    }
  }

  return result;
}
