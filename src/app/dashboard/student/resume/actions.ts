"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db/prisma";
import {
  createResumeSignedUrl,
  getCurrentStudentResumeContext,
} from "@/lib/student/resume";
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

  try {
    if (context.resume) {
      await prisma.resume.update({
        where: {
          id: context.resume.id,
        },
        data: {
          fileName: resumeFile.name,
          fileUrl: newPath,
          parseStatus: "NOT_STARTED",
          parsedText: null,
        },
      });
    } else {
      await prisma.resume.create({
        data: {
          studentProfileId: context.profileId,
          fileName: resumeFile.name,
          fileUrl: newPath,
          parseStatus: "NOT_STARTED",
        },
      });
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

  revalidatePath("/dashboard/student");

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

  revalidatePath("/dashboard/student");

  return {
    error: null,
    success: "Resume deleted.",
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
