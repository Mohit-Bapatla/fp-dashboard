import { NextResponse } from "next/server";

import {
  createDemoSessionToken,
  DEMO_SESSION_COOKIE,
  demoSessionCookieOptions,
  getConfiguredDemoAccessCode,
  matchesDemoAccessCode,
} from "@/lib/demo/recruiter-session";

function demoResponse(error?: "invalid" | "unavailable") {
  const redirectTo = error ? `/demo?error=${error}` : "/demo";
  return NextResponse.json({ redirectTo });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "exit") {
    const response = demoResponse();
    response.cookies.set(DEMO_SESSION_COOKIE, "", {
      ...demoSessionCookieOptions(),
      maxAge: 0,
    });
    return response;
  }

  const configuredCode = getConfiguredDemoAccessCode();
  if (!configuredCode) return demoResponse("unavailable");

  const submittedCode = formData.get("accessCode");
  if (
    typeof submittedCode !== "string" ||
    !matchesDemoAccessCode(submittedCode, configuredCode)
  ) {
    return demoResponse("invalid");
  }

  const response = demoResponse();
  response.cookies.set(
    DEMO_SESSION_COOKIE,
    createDemoSessionToken(configuredCode),
    demoSessionCookieOptions(),
  );
  return response;
}
