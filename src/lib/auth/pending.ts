// The "we emailed you a code" step shared by register and resend (T-147): issue a code within the
// resend limits, save it (HMAC only), email it, and answer 202 { needsVerification, email }.

import { NextResponse } from "next/server";
import { sendVerificationCode, type Mailer } from "@/lib/email/send";
import { issueCode, revealCodeForTests } from "./verify";
import { saveUser, type StoredUser } from "./users";

export interface PendingBody {
  needsVerification: true;
  email: string;
  /** Only for requests carrying the E2E secret header (see revealCodeForTests). */
  testCode?: string;
}

export async function issueAndSend(
  request: Request,
  user: StoredUser,
  secret: string,
  mailer: Mailer,
): Promise<NextResponse> {
  const issued = issueCode(user, secret);
  if (!issued.ok) {
    return NextResponse.json(
      {
        error: `Wait ${issued.retryAfterSeconds} seconds before asking for another code.`,
        needsVerification: true,
        email: user.email,
        retryAfter: issued.retryAfterSeconds,
      },
      { status: 429 },
    );
  }
  await saveUser(issued.user);
  try {
    await sendVerificationCode(user.email, issued.code, mailer);
  } catch (error) {
    // Never log the address or the code: only what kind of failure it was.
    const code = (error as { code?: unknown })?.code;
    console.error(
      `[mail] verification send failed (${String(code ?? "error")})`,
    );
    return NextResponse.json(
      {
        error: "We couldn't send the code. Try “Send a new code” in a minute.",
        needsVerification: true,
        email: user.email,
      },
      { status: 502 },
    );
  }
  const body: PendingBody = { needsVerification: true, email: user.email };
  if (revealCodeForTests(request)) body.testCode = issued.code;
  return NextResponse.json(body, { status: 202 });
}
