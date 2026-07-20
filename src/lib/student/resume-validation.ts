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

export function sanitizeResumeFileName(fileName: string, extension: string) {
  const baseName = fileName
    .replace(/[\\/]/g, "-")
    .replace(/[^a-zA-Z0-9._ -]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);

  return baseName || `resume.${extension}`;
}

function bytesStartWith(bytes: Uint8Array, signature: readonly number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

export function validateResumeFileContent(
  bytes: Uint8Array,
  extension: "pdf" | "docx",
): { success: true } | { success: false; error: string } {
  if (extension === "pdf") {
    const header = new TextDecoder("latin1").decode(bytes.slice(0, 1024));
    return header.includes("%PDF-")
      ? { success: true }
      : {
          success: false,
          error:
            "This file does not contain a valid PDF signature. Export it as a PDF or DOCX and try again.",
        };
  }

  const hasZipSignature =
    bytesStartWith(bytes, [0x50, 0x4b, 0x03, 0x04]) ||
    bytesStartWith(bytes, [0x50, 0x4b, 0x05, 0x06]) ||
    bytesStartWith(bytes, [0x50, 0x4b, 0x07, 0x08]);
  const archiveIndex = new TextDecoder("latin1").decode(bytes);
  const hasDocxParts =
    archiveIndex.includes("[Content_Types].xml") &&
    archiveIndex.includes("word/document.xml");

  return hasZipSignature && hasDocxParts
    ? { success: true }
    : {
        success: false,
        error:
          "This file does not contain a valid DOCX document. Export it as a PDF or DOCX and try again.",
      };
}

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
