import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

function filesUnder(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

const demoSourceFiles = [
  ...filesUnder(resolve("src/app/demo")),
  ...filesUnder(resolve("src/components/demo")),
  resolve("src/lib/demo/recruiter-fixtures.ts"),
  resolve("src/lib/demo/recruiter-session.ts"),
];

describe("recruiter demo architecture boundary", () => {
  it("does not import protected auth, data, storage, or mutation modules", () => {
    const forbiddenImports = [
      /from ["']@clerk\//,
      /from ["']@supabase\//,
      /from ["']@\/generated\/prisma/,
      /from ["']@\/lib\/db/,
      /from ["']@\/lib\/supabase/,
      /from ["']@\/lib\/demo\/demo-users/,
      /from ["']@\/app\/dashboard/,
      /from ["']@\/app\/api/,
    ];

    for (const file of demoSourceFiles) {
      const source = readFileSync(file, "utf8");
      for (const forbiddenImport of forbiddenImports) {
        expect(source, `${file} imported ${forbiddenImport}`).not.toMatch(
          forbiddenImport,
        );
      }
    }
  });

  it("never exposes the access code as a public environment variable or logs it", () => {
    const source = demoSourceFiles
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");
    expect(source).not.toContain("NEXT_PUBLIC_DEMO_ACCESS_CODE");
    expect(source).not.toMatch(/console\.(?:debug|info|log|warn|error)/);
  });

  it("keeps the demo out of public navigation and the sitemap", () => {
    const publicSources = [
      resolve("src/components/marketing/marketing-header.tsx"),
      resolve("src/components/marketing/marketing-footer.tsx"),
      resolve("src/app/sitemap.ts"),
    ];
    for (const file of publicSources) {
      expect(readFileSync(file, "utf8")).not.toContain('"/demo"');
    }
  });
});
