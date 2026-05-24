"use server";

import { revalidatePath } from "next/cache";

import {
  buildImportPreview,
  importPreviewRows,
  importTypes,
  type ImportPreview,
  type ImportSummary,
} from "@/lib/imports/data-imports";
import { getActorIdFromClerkUserId } from "@/lib/audit/audit-log";
import { assertAdminAccess } from "@/lib/admin/authorization";
import {
  enforceRateLimit,
  formatRateLimitMessage,
} from "@/lib/security/rate-limit";

export type CsvImportActionState = {
  error: string | null;
  preview: ImportPreview | null;
  summary: ImportSummary | null;
};

const initialSummary: ImportSummary = {
  created: 0,
  errors: [],
  skippedDuplicates: 0,
  skippedInvalid: 0,
  updated: 0,
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

async function getCsvText(formData: FormData) {
  const pasted = getString(formData, "csvText");

  if (pasted) {
    return pasted;
  }

  const file = formData.get("csvFile");

  if (file instanceof File && file.size > 0) {
    return file.text();
  }

  return "";
}

function getDefaultOpportunityStatus(formData: FormData) {
  return getString(formData, "defaultOpportunityStatus") === "PENDING_APPROVAL"
    ? "PENDING_APPROVAL"
    : "DRAFT";
}

export async function previewCsvImport(
  _previousState: CsvImportActionState,
  formData: FormData,
): Promise<CsvImportActionState> {
  const { userId } = await assertAdminAccess();
  const rateLimit = await enforceRateLimit({
    action: "csv_import_preview",
    identifier: `user:${userId}`,
    limit: 20,
    windowSeconds: 15 * 60,
  });

  if (!rateLimit.allowed) {
    return {
      error: formatRateLimitMessage(rateLimit),
      preview: null,
      summary: null,
    };
  }

  const importType = getString(formData, "importType");
  const csvText = await getCsvText(formData);

  if (!importTypes.includes(importType as never)) {
    return {
      error: "Choose an import type.",
      preview: null,
      summary: null,
    };
  }

  if (!csvText) {
    return {
      error: "Paste CSV content or upload a CSV file.",
      preview: null,
      summary: null,
    };
  }

  const preview = await buildImportPreview({
    csvText,
    defaultOpportunityStatus: getDefaultOpportunityStatus(formData),
    importType,
  });

  return {
    error: preview.errors.length > 0 ? preview.errors.join(" ") : null,
    preview,
    summary: null,
  };
}

export async function importCsvPreview(
  _previousState: CsvImportActionState,
  formData: FormData,
): Promise<CsvImportActionState> {
  const { userId } = await assertAdminAccess();
  const rateLimit = await enforceRateLimit({
    action: "csv_import_commit",
    identifier: `user:${userId}`,
    limit: 5,
    windowSeconds: 15 * 60,
  });

  if (!rateLimit.allowed) {
    return {
      error: formatRateLimitMessage(rateLimit),
      preview: null,
      summary: null,
    };
  }

  const payload = getString(formData, "previewPayload");

  if (!payload) {
    return {
      error: "Preview the CSV before importing.",
      preview: null,
      summary: null,
    };
  }

  let preview: ImportPreview;

  try {
    preview = JSON.parse(payload) as ImportPreview;
  } catch {
    return {
      error: "Import preview could not be read.",
      preview: null,
      summary: null,
    };
  }

  const actorId = await getActorIdFromClerkUserId(userId);
  const summary = await importPreviewRows({
    actorId,
    preview,
  });

  revalidatePath("/dashboard/admin/data-imports");
  revalidatePath("/dashboard/admin/students");
  revalidatePath("/dashboard/admin/partners");
  revalidatePath("/dashboard/admin/opportunities");

  return {
    error:
      summary.errors.length > 0 ? "Some rows could not be imported." : null,
    preview,
    summary: summary ?? initialSummary,
  };
}
