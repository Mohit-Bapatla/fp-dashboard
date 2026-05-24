export const maxResumeFileSize = 5 * 1024 * 1024;

const allowedResumeTypes = [
  {
    extension: "pdf",
    mimeType: "application/pdf",
    acceptedMimeTypes: [
      "application/pdf",
      "application/x-pdf",
      "application/acrobat",
      "application/vnd.pdf",
      "application/octet-stream",
      "",
    ],
  },
  {
    extension: "docx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    acceptedMimeTypes: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/octet-stream",
      "",
    ],
  },
] as const;

export type ResumeValidationResult =
  | {
      success: true;
      extension: "pdf" | "docx";
      mimeType: string;
    }
  | {
      success: false;
      error: string;
    };

export function validateResumeFile(file: File): ResumeValidationResult {
  if (file.size <= 0) {
    return {
      success: false,
      error: "Choose a resume file to upload.",
    };
  }

  if (file.size > maxResumeFileSize) {
    return {
      success: false,
      error: "Resume must be 5 MB or smaller.",
    };
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  const allowedType = allowedResumeTypes.find((type) => {
    return (
      type.extension === extension &&
      (type.acceptedMimeTypes as readonly string[]).includes(file.type)
    );
  });

  if (!allowedType) {
    return {
      success: false,
      error: "Resume must be a PDF or DOCX file.",
    };
  }

  return {
    success: true,
    extension: allowedType.extension,
    mimeType: allowedType.mimeType,
  };
}
