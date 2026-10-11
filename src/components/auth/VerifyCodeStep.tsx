"use client";

// T-147: "We emailed you a code" — the second step of sign-up (and of logging in to an account
// that was never verified). One numeric field (paste works, autocomplete one-time-code), a resend
// button with a countdown, and inline errors.

import React, { useEffect, useState, type FormEvent } from "react";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { resendCode, verifyEmail, type AuthUser } from "./authClient";

export const RESEND_COUNTDOWN_S = 60;

/** Digits only, at most 6: "123 456" and "12-34-56" paste cleanly. */
export function cleanCode(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 6);
}

export interface VerifyCodeStepProps {
  idPrefix: string;
  email: string;
  /** Seconds before "Send a new code" unlocks (a code was just sent). */
  initialResendIn?: number;
  /** A message to show first, e.g. why the step opened from the login form. */
  initialInfo?: string;
  onVerified: (user: AuthUser) => void;
  onBack: () => void;
}

export function VerifyCodeStep({
  idPrefix,
  email,
  initialResendIn = RESEND_COUNTDOWN_S,
  initialInfo,
  onVerified,
  onBack,
}: VerifyCodeStepProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [info, setInfo] = useState(initialInfo);
  const [pending, setPending] = useState(false);
  const [resendIn, setResendIn] = useState(initialResendIn);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (code.length !== 6) {
      setError("Enter the 6-digit code from the email.");
      return;
    }
    setPending(true);
    setError(undefined);
    const result = await verifyEmail(email, code);
    setPending(false);
    if (result.user) {
      onVerified(result.user);
      return;
    }
    setError(result.error ?? "That code didn't work. Try again.");
  }

  async function onResend() {
    setError(undefined);
    setInfo(undefined);
    const result = await resendCode(email);
    if (result.error) {
      setError(result.error);
      if (result.retryAfter) setResendIn(result.retryAfter);
      return;
    }
    setCode("");
    setInfo(`We sent a new code to ${email}.`);
    setResendIn(RESEND_COUNTDOWN_S);
  }

  const codeId = `${idPrefix}-code`;
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="flex items-start gap-3">
        <MailCheck
          className="mt-0.5 size-5 shrink-0 text-accent"
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-semibold text-graphite">
            Check your email
          </p>
          <p className="mt-1 text-sm leading-relaxed text-pencil">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-graphite">{email}</span>. It
            expires in 10 minutes.
          </p>
        </div>
      </div>
      <div>
        <Label htmlFor={codeId}>Verification code</Label>
        <Input
          id={codeId}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          autoFocus
          value={code}
          onChange={(event) => {
            setCode(cleanCode(event.target.value));
            setError(undefined);
          }}
          onPaste={(event) => {
            event.preventDefault();
            setCode(cleanCode(event.clipboardData.getData("text")));
            setError(undefined);
          }}
          placeholder="123456"
          className="mt-2 text-center text-lg tracking-[0.4em]"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${codeId}-error` : undefined}
        />
      </div>
      {info && !error && (
        <p role="status" className="text-sm text-pencil">
          {info}
        </p>
      )}
      {error && (
        <p
          id={`${codeId}-error`}
          role="alert"
          className="text-sm leading-relaxed text-danger"
        >
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="h-10 w-full">
        {pending ? "Checking…" : "Verify and continue"}
      </Button>
      <div className="flex items-center justify-between gap-3 text-sm">
        <button
          type="button"
          onClick={onResend}
          disabled={resendIn > 0}
          className="text-accent underline-offset-4 hover:underline disabled:cursor-default disabled:text-pencil disabled:no-underline"
        >
          {resendIn > 0 ? `Send a new code in ${resendIn}s` : "Send a new code"}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="text-pencil underline-offset-4 hover:text-graphite hover:underline"
        >
          Use a different email
        </button>
      </div>
    </form>
  );
}
