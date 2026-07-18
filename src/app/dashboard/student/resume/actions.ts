"use server";

import { revalidatePath } from "next/cache";

import { createAuditLog } from "@/lib/audit/audit-log";
import { parseResume } from "@/lib/ai/resume-parsing";
import {
  createResumeParsingError,
  getPersistedResumeParseFailureReason,
  getResumeParseUserMessage,
  logResumeParseFailure,
  ResumeParsingError,
  type ResumeParseLogContext,
} from "@/lib/ai/resume-parsing-errors";
import { prisma } from "@/lib/db/prisma";
import {
  enforceRateLimit,
  formatRateLimitMessage,
} from "@/lib/security/rate-limit";
import {
  createResumeSignedUrl,
  getCurrentStudentResumeContext,
} from "@/lib/student/resume";
import { RESUME_PARSE_STALE_AFTER_MS } from "@/lib/student/resume-parse-state";
import { validateResumeFile } from "@/lib/student/resume-validation";
import {
  createSupabaseAdminClient,
  resumeBucketName,
} from "@/lib/storage/supabase-admin";

export type ResumeActionState = {
  error: string | null;
  success: string | null;
};

export type ResumeDownloadActionState = {
  error: string | null;
  signedUrl: string | null;
};

function buildResumePath(profileId: string, extension: string) {
  return `students/${profileId}/resume-${Date.now()}.${extension}`;
}

function getResumeParseLogContext(
  resumeId: string,
  fileName: string,
): ResumeParseLogContext {
  const extensionIndex = fileName.lastIndexOf(".");

  return {
    byteLength: null,
    extension:
      extensionIndex >= 0 ? fileName.slice(extensionIndex).toLowerCase() : null,
    mimeType: null,
    resumeId,
  };
}

async function markResumeParseFailed({
  context,
  error,
  resumeId,
}: {
  context: ResumeParseLogContext;
  error: unknown;
  resumeId: string;
}) {
  try {
    await prisma.resume.update({
      where: {
        id: resumeId,
      },
      data: {
        parseFailureReason: getPersistedResumeParseFailureReason(error),
        parseStatus: "FAILED",
      },
    });
  } catch (statusError) {
    logResumeParseFailure({
      context,
      error: statusError,
      stage: "status_update",
    });
  }
}

export async function uploadStudentResume(
  _previousState: ResumeActionState,
  formData: FormData,
): Promise<ResumeActionState> {
  const context = await getCurrentStudentResumeContext();

  if (!context) {
    return {
      error: "Complete student onboarding before uploading a resume.",
      success: null,
    };
  }

  const rateLimit = await enforceRateLimit({
    action: "resume_upload",
    identifier: `user:${context.userId}`,
    limit: 5,
    windowSeconds: 60 * 60,
  });

  if (!rateLimit.allowed) {
    return {
      error: formatRateLimitMessage(rateLimit),
      success: null,
    };
  }

  const resumeFile = formData.get("resume");

  if (!(resumeFile instanceof File)) {
    return {
      error: "Choose a resume file to upload.",
      success: null,
    };
  }

  const validation = validateResumeFile(resumeFile);

  if (!validation.success) {
    return {
      error: validation.error,
      success: null,
    };
  }

  const supabase = createSupabaseAdminClient();
  const newPath = buildResumePath(context.profileId, validation.extension);
  const bytes = await resumeFile.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from(resumeBucketName)
    .upload(newPath, bytes, {
      contentType: validation.mimeType,
      upsert: false,
    });

  if (uploadError) {
    return {
      error: "Resume upload failed. Please try again.",
      success: null,
    };
  }

  const oldPath = context.resume?.fileUrl ?? null;
  const profile = await prisma.studentProfile.findUnique({
    where: {
      id: context.profileId,
    },
    select: {
      userId: true,
    },
  });
  let resumeId: string;

  try {
    if (context.resume) {
      const resume = await prisma.resume.update({
        where: {
          id: context.resume.id,
        },
        data: {
          fileName: resumeFile.name,
          extractedCertifications: [],
          extractedEducation: [],
          extractedExperience: [],
          extractedSkills: [],
          fileUrl: newPath,
          parseFailureReason: null,
          parseStatus: "NOT_STARTED",
          parsedSummary: null,
          parsedText: null,
        },
        select: {
          id: true,
        },
      });
      resumeId = resume.id;
    } else {
      const resume = await prisma.resume.create({
        data: {
          extractedCertifications: [],
          extractedEducation: [],
          extractedExperience: [],
          extractedSkills: [],
          studentProfileId: context.profileId,
          fileName: resumeFile.name,
          fileUrl: newPath,
          parseFailureReason: null,
          parseStatus: "NOT_STARTED",
          parsedSummary: null,
          parsedText: null,
        },
        select: {
          id: true,
        },
      });
      resumeId = resume.id;
    }
  } catch {
    await supabase.storage.from(resumeBucketName).remove([newPath]);

    return {
      error: "Resume metadata could not be saved.",
      success: null,
    };
  }

  if (oldPath) {
    await supabase.storage.from(resumeBucketName).remove([oldPath]);
  }

  await createAuditLog({
    action: context.resume ? "RESUME_REPLACED" : "RESUME_UPLOADED",
    actorId: profile?.userId ?? null,
    entityId: resumeId,
    entityType: "Resume",
    metadata: {
      fileName: resumeFile.name,
      studentProfileId: context.profileId,
    },
  });

  revalidatePath("/dashboard/student");
  revalidatePath("/dashboard/student/profile");

  return {
    error: null,
    success: context.resume ? "Resume replaced." : "Resume uploaded.",
  };
}

export async function deleteStudentResume(
  _previousState: ResumeActionState,
  formData: FormData,
): Promise<ResumeActionState> {
  const context = await getCurrentStudentResumeContext();
  const resumeId = formData.get("resumeId");

  if (!context?.resume || context.resume.id !== resumeId) {
    return {
      error: "Resume was not found.",
      success: null,
    };
  }

  const supabase = createSupabaseAdminClient();

  if (context.resume.fileUrl) {
    const { error } = await supabase.storage
      .from(resumeBucketName)
      .remove([context.resume.fileUrl]);

    if (error) {
      return {
        error: "Resume file could not be deleted.",
        success: null,
      };
    }
  }

  await prisma.resume.delete({
    where: {
      id: context.resume.id,
    },
  });
  const profile = await prisma.studentProfile.findUnique({
    where: {
      id: context.profileId,
    },
    select: {
      userId: true,
    },
  });

  await createAuditLog({
    action: "RESUME_DELETED",
    actorId: profile?.userId ?? null,
    entityId: context.resume.id,
    entityType: "Resume",
    metadata: {
      fileName: context.resume.fileName,
      studentProfileId: context.profileId,
    },
  });

  revalidatePath("/dashboard/student");
  revalidatePath("/dashboard/student/profile");

  return {
    error: null,
    success: "Resume deleted.",
  };
}

export async function parseStudentResume(
  _previousState: ResumeActionState,
  formData: FormData,
): Promise<ResumeActionState> {
  const context = await getCurrentStudentResumeContext();
  const resumeId = formData.get("resumeId");

  if (
    !context?.resume ||
    typeof resumeId !== "string" ||
    context.resume.id !== resumeId
  ) {
    return {
      error: "Resume was not found.",
      success: null,
    };
  }

  const rateLimit = await enforceRateLimit({
    action: "resume_parse",
    identifier: `user:${context.userId}`,
    limit: 10,
    windowSeconds: 60 * 60,
  });

  if (!rateLimit.allowed) {
    return {
      error: formatRateLimitMessage(rateLimit),
      success: null,
    };
  }

  const parseLogContext = getResumeParseLogContext(
    context.resume.id,
    context.resume.fileName,
  );
  const staleBefore = new Date(Date.now() - RESUME_PARSE_STALE_AFTER_MS);

  try {
    const claimed = await prisma.resume.updateMany({
      where: {
        id: context.resume.id,
        studentProfileId: context.profileId,
        OR: [
          { parseStatus: { not: "PROCESSING" } },
          { updatedAt: { lte: staleBefore } },
        ],
      },
      data: {
        parseFailureReason: null,
        parseStatus: "PROCESSING",
      },
    });

    if (claimed.count !== 1) {
      return {
        error: "This resume is already being parsed. Please wait a moment.",
        success: null,
      };
    }
  } catch (error) {
    logResumeParseFailure({
      context: parseLogContext,
      error,
      stage: "status_update",
    });

    return {
      error: getResumeParseUserMessage(error),
      success: null,
    };
  }

  let deterministicPersisted = false;
  let parsedResume: Awaited<ReturnType<typeof parseResume>>;

  try {
    parsedResume = await parseResume(
      context.resume.id,
      context.profileId,
      async (deterministicResume, sourceContext) => {
        Object.assign(parseLogContext, sourceContext);

        try {
          await prisma.resume.update({
            where: {
              id: resumeId,
            },
            data: {
              extractedCertifications: deterministicResume.certifications,
              extractedEducation: deterministicResume.education,
              extractedExperience: deterministicResume.experience,
              extractedSkills: deterministicResume.skills,
              parseFailureReason: null,
              parsedSummary: deterministicResume.summary,
              parsedText: deterministicResume.text,
              parseStatus: "COMPLETED",
            },
          });
          deterministicPersisted = true;
        } catch (error) {
          throw createResumeParsingError({
            code: "TEMPORARY_FAILURE",
            context: sourceContext,
            error,
            stage: "prisma_result_update",
          });
        }
      },
    );
  } catch (error) {
    if (deterministicPersisted) {
      logResumeParseFailure({
        context: parseLogContext,
        error,
        level: "warning",
        stage: "openai_enrichment",
      });

      revalidatePath("/dashboard/student");
      revalidatePath("/dashboard/student/profile");

      return {
        error: null,
        success: "Resume parsed without optional enrichment.",
      };
    }

    if (!(error instanceof ResumeParsingError)) {
      logResumeParseFailure({
        context: parseLogContext,
        error,
        stage: "deterministic_extraction",
      });
    }

    await markResumeParseFailed({
      context: parseLogContext,
      error,
      resumeId: context.resume.id,
    });

    revalidatePath("/dashboard/student");
    revalidatePath("/dashboard/student/profile");

    return {
      error: getResumeParseUserMessage(error),
      success: null,
    };
  }

  if (parsedResume.usedEnrichment) {
    try {
      await prisma.resume.update({
        where: {
          id: context.resume.id,
        },
        data: {
          extractedCertifications: parsedResume.certifications,
          extractedEducation: parsedResume.education,
          extractedExperience: parsedResume.experience,
          extractedSkills: parsedResume.skills,
          parsedSummary: parsedResume.summary,
          parsedText: parsedResume.text,
        },
      });
    } catch (error) {
      logResumeParseFailure({
        context: parseLogContext,
        error,
        level: "warning",
        stage: "prisma_result_update",
      });
    }
  }

  if (!deterministicPersisted) {
    const error = new Error(
      "Deterministic resume result was not persisted before enrichment.",
    );
    logResumeParseFailure({
      context: parseLogContext,
      error,
      stage: "prisma_result_update",
    });
    await markResumeParseFailed({
      context: parseLogContext,
      error,
      resumeId: context.resume.id,
    });

    revalidatePath("/dashboard/student");
    revalidatePath("/dashboard/student/profile");

    return {
      error: getResumeParseUserMessage(error),
      success: null,
    };
  }

  revalidatePath("/dashboard/student");
  revalidatePath("/dashboard/student/profile");

  return {
    error: null,
    success: "Resume parsed.",
  };
}

export async function createStudentResumeSignedUrl(
  _previousState: ResumeDownloadActionState,
  formData: FormData,
): Promise<ResumeDownloadActionState> {
  const resumeId = formData.get("resumeId");

  if (typeof resumeId !== "string") {
    return {
      error: "Resume was not found.",
      signedUrl: null,
    };
  }

  const result = await createResumeSignedUrl(resumeId);

  if (!result.ok) {
    return {
      error: result.error,
      signedUrl: null,
    };
  }

  return {
    error: null,
    signedUrl: result.signedUrl,
  };
}
