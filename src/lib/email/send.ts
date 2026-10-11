// Outgoing email (T-147): the verification code over Gmail SMTP (smtp.gmail.com:465) with
// GMAIL_USER + GMAIL_APP_PASSWORD. Without them, outside production the code is printed to the
// server console (local first, ADR-008); in production the caller answers 503. The code is never
// logged in production.

import nodemailer, { type Transporter } from "nodemailer";

type Env = Record<string, string | undefined>;

export type Mailer =
  { kind: "gmail"; user: string; pass: string } | { kind: "console" };

/** How mail goes out in this environment, or null when production has no mail set up. */
export function mailerFromEnv(env: Env = process.env): Mailer | null {
  const user = env.GMAIL_USER?.trim();
  const pass = env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
  if (user && pass) return { kind: "gmail", user, pass };
  return env.NODE_ENV === "production" ? null : { kind: "console" };
}

export function verificationEmail(code: string) {
  const subject = `Your Galleriverse code: ${code}`;
  const text = [
    `Your Galleriverse verification code is ${code}.`,
    "",
    "Enter it on the sign-up page to finish creating your account. It expires in 10 minutes.",
    "",
    "If you didn't try to sign up, you can ignore this email.",
  ].join("\n");
  const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#1e2022;max-width:420px">
  <p style="margin:0 0 12px">Your Galleriverse verification code:</p>
  <p style="font-size:28px;letter-spacing:6px;font-weight:600;margin:0 0 16px">${code}</p>
  <p style="margin:0 0 8px;color:#7d8085">Enter it on the sign-up page to finish creating your account. It expires in 10 minutes.</p>
  <p style="margin:0;color:#7d8085">If you didn't try to sign up, you can ignore this email.</p>
</div>`;
  return { subject, text, html };
}

let gmailTransport: { key: string; transport: Transporter } | null = null;

function transportFor(mailer: { user: string; pass: string }): Transporter {
  const key = `${mailer.user}:${mailer.pass.length}`;
  if (gmailTransport?.key !== key) {
    gmailTransport = {
      key,
      transport: nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: mailer.user, pass: mailer.pass },
      }),
    };
  }
  return gmailTransport.transport;
}

/** Sends the code. Throws when Gmail refuses; the route turns that into a friendly 502. */
export async function sendVerificationCode(
  to: string,
  code: string,
  mailer: Mailer,
  makeTransport: (m: {
    user: string;
    pass: string;
  }) => Pick<Transporter, "sendMail"> = transportFor,
): Promise<void> {
  const mail = verificationEmail(code);
  if (mailer.kind === "console") {
    console.info(`[mail:dev] verification code for ${to}: ${code}`);
    return;
  }
  await makeTransport(mailer).sendMail({
    from: `Galleriverse <${mailer.user}>`,
    to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });
}
