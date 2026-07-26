import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const workflow = readFileSync(
  join(process.cwd(), ".github", "workflows", "ci.yml"),
  "utf8",
);

describe("authenticated reliability workflow policy", () => {
  it("separates configuration from actual test coverage", () => {
    expect(workflow).toContain("name: Authenticated reliability configuration");
    expect(workflow).toContain(
      "name: Authenticated reliability tests (Clerk development)",
    );
    expect(workflow).toContain("needs: authenticated-reliability-config");
    expect(workflow).toContain(
      "needs.authenticated-reliability-config.outputs.configured == 'true'",
    );
    expect(workflow).toContain(
      "The authenticated Playwright suite executed successfully",
    );
    expect(workflow).not.toContain(
      "name: Authenticated reliability (Clerk development)",
    );
  });

  it("uses the protected development environment and exact secret names", () => {
    expect(workflow.match(/environment: ci-clerk-development/g)).toHaveLength(
      2,
    );
    expect(workflow).toContain(
      "CLERK_SECRET_KEY: ${{ secrets.CLERK_E2E_SECRET_KEY }}",
    );
    expect(workflow).toContain(
      "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.CLERK_E2E_PUBLISHABLE_KEY }}",
    );
    expect(workflow).toContain('"$CLERK_SECRET_KEY" == sk_live_*');
    expect(workflow).toContain(
      '"$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" == pk_live_*',
    );
  });

  it("keeps fork PRs away from secrets and does not use pull_request_target", () => {
    expect(workflow).toContain(
      "github.event.pull_request.head.repo.full_name == github.repository",
    );
    expect(workflow).not.toContain("pull_request_target");
  });

  it("does not publish authenticated browser artifacts", () => {
    expect(workflow).not.toContain("actions/upload-artifact");
    expect(workflow).toContain(
      'artifact_directory="$GITHUB_WORKSPACE/test-results/reliability-auth"',
    );
    expect(workflow).toContain('rm -rf -- "$artifact_directory"');
  });
});
