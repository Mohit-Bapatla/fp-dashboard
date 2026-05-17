import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import type { Resume } from "@/generated/prisma/client";
import { getAppRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/db/prisma";
import {
  createSupabaseAdminClient,
  resumeBucketName,
} from "@/lib/storage/supabase-admin";
import { getOrCreateCurrentStudentUser } from "@/lib/student/profile";

export type CurrentStudentResumeContext = {
  profileId: string;
  resume: Resume | null;
};

export async function getCurrentStudentResumeContext(): Promise<CurrentStudentResumeContext | null> {
  const { redirectToSignIn, sessionClaims, userId } = await auth();

  if (!userId) {
    return redirectToSignIn();
  }

  if (getAppRole(sessionClaims?.metadata?.role) !== "STUDENT") {
    redirect("/dashboard");
  }

  const user = await getOrCreateCurrentStudentUser(userId);

  if (!user.studentProfile) {
    return null;
  }

  const resume = await prisma.resume.findFirst({
    where: {
      studentProfileId: user.studentProfile.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return {
    profileId: user.studentProfile.id,
    resume,
  };
}

export async function createResumeSignedUrl(resumeId: string): Promise<
  | {
      ok: false;
      error: string;
    }
  | {
      ok: true;
      signedUrl: string;
    }
> {
  const context = await getCurrentStudentResumeContext();

  if (
    !context?.resume ||
    context.resume.id !== resumeId ||
    !context.resume.fileUrl
  ) {
    return {
      ok: false,
      error: "Resume was not found.",
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(resumeBucketName)
    .createSignedUrl(context.resume.fileUrl, 60 * 5, {
      download: context.resume.fileName,
    });

  if (error || !data?.signedUrl) {
    return {
      ok: false,
      error: "Unable to create a secure download link.",
    };
  }

  return {
    ok: true,
    signedUrl: data.signedUrl,
  };
}
