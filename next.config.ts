import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const pdfRuntimeFiles = [
  "./node_modules/@napi-rs/canvas/**/*",
  "./node_modules/@napi-rs/canvas-linux-x64-gnu/**/*",
  "./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  async redirects() {
    return [
      {
        source: "/grants-sponsors",
        destination: "/support#grants",
        permanent: true,
      },
      {
        source: "/get-connected",
        destination: "/students",
        permanent: true,
      },
      {
        source: "/start-chapter",
        destination: "/chapters",
        permanent: true,
      },
      {
        source: "/how-it-works",
        destination: "/#how-it-works",
        permanent: true,
      },
      {
        source: "/donate",
        destination: "/support#donate",
        permanent: true,
      },
    ];
  },
  outputFileTracingIncludes: {
    "/dashboard/student": pdfRuntimeFiles,
    "/dashboard/student/profile": pdfRuntimeFiles,
  },
  serverExternalPackages: ["pdf-parse"],
};

export default withSentryConfig(nextConfig, {
  silent: true,
});
