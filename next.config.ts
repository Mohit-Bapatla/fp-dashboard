import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const pdfRuntimeFiles = [
  "./node_modules/@napi-rs/canvas/**/*",
  "./node_modules/@napi-rs/canvas-linux-x64-gnu/**/*",
  "./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
];

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/dashboard/student": pdfRuntimeFiles,
    "/dashboard/student/profile": pdfRuntimeFiles,
  },
  serverExternalPackages: ["pdf-parse"],
};

export default withSentryConfig(nextConfig, {
  silent: true,
});
