import "server-only";

import { createClient } from "@supabase/supabase-js";

export const resumeBucketName =
  process.env.SUPABASE_RESUME_BUCKET ?? "student-resumes";

export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase storage environment variables are not configured.",
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
}
