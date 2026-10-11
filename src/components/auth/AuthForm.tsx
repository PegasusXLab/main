"use client";

import React, { useState, type FormEvent } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  EMAIL_RE,
  loginUser,
  registerUser,
  resendCode,
  type AuthResult,
  type AuthUser,
} from "./authClient";
import { RESEND_COUNTDOWN_S, VerifyCodeStep } from "./VerifyCodeStep";

interface PendingVerification {
  email: string;
  info?: string;
  resendIn: number;
}

export type AuthMode = "register" | "login";

export interface AuthFormProps {
  mode: AuthMode;
  onSuccess?: (user: AuthUser) => void;
  className?: string;
}

export interface AuthFormValues {
  name: string;
  email: string;
  password: string;
}

export interface AuthFormErrors {
  name?: string;
  email?: string;
  password?: string;
}

/** Pure client validation shared by `/register`, `/login` and the landing panel. */
export function validateAuthForm(
  mode: AuthMode,
  values: AuthFormValues,
): AuthFormErrors {
  const errors: AuthFormErrors = {};
  if (mode === "register" && values.name.trim().length > 60) {
    errors.name = "Keep your name under 60 characters.";
  }
  if (!EMAIL_RE.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (mode === "register" && values.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  } else if (mode === "login" && values.password.length === 0) {
    errors.password = "Enter your password.";
  }
  return errors;
}

export function AuthForm({ mode, onSuccess, className = "" }: AuthFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [submitError, setSubmitError] = useState<string>();
  const [pending, setPending] = useState(false);
  /** Honeypot (T-147): stays empty for people. */
  const [website, setWebsite] = useState("");
  /** T-147: set once the server asks for the emailed code. */
  const [verifyFor, setVerifyFor] = useState<PendingVerification | null>(null);

  const isRegister = mode === "register";

  function clearField(field: keyof AuthFormErrors) {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const next = validateAuthForm(mode, { name, email, password });
    setErrors(next);
    setSubmitError(undefined);
    if (next.name || next.email || next.password) return;

    setPending(true);
    const result: AuthResult = isRegister
      ? await registerUser({ name, email, password, website })
      : await loginUser({ email, password });
    if (result.needsVerification) {
      await openVerification(result);
      setPending(false);
      return;
    }
    setPending(false);

    if (result.error) {
      setSubmitError(result.error);
      return;
    }
    if (result.user) onSuccess?.(result.user);
  }

  /** Register sent a code (202), or login found an unverified account (403: send one now). */
  async function openVerification(result: AuthResult) {
    const pendingEmail = result.needsVerification!.email;
    if (result.status === 403) {
      const sent = await resendCode(pendingEmail);
      setVerifyFor({
        email: pendingEmail,
        info: sent.error
          ? `Your email isn't verified yet. ${sent.error}`
          : "Your email isn't verified yet, so we sent you a new code.",
        resendIn: sent.error ? (sent.retryAfter ?? 0) : RESEND_COUNTDOWN_S,
      });
      return;
    }
    setVerifyFor({
      email: pendingEmail,
      info: result.error,
      resendIn:
        result.status === 202 ? RESEND_COUNTDOWN_S : (result.retryAfter ?? 0),
    });
  }

  if (verifyFor) {
    return (
      <div className={className}>
        <VerifyCodeStep
          idPrefix={mode}
          email={verifyFor.email}
          initialInfo={verifyFor.info}
          initialResendIn={verifyFor.resendIn}
          onVerified={(user) => onSuccess?.(user)}
          onBack={() => {
            setVerifyFor(null);
            setPassword("");
          }}
        />
      </div>
    );
  }

  const emailErrorId = `${mode}-email-error`;

  return (
    <form onSubmit={onSubmit} noValidate className={`space-y-4 ${className}`}>
      {isRegister && (
        <div>
          <Label htmlFor={`${mode}-name`}>Name (optional)</Label>
          <Input
            id={`${mode}-name`}
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              clearField("name");
            }}
            placeholder="How we greet you"
            className="mt-2"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? `${mode}-name-error` : undefined}
          />
          {errors.name && (
            <p
              id={`${mode}-name-error`}
              role="alert"
              className="mt-1 text-sm text-danger"
            >
              {errors.name}
            </p>
          )}
        </div>
      )}

      <div>
        <Label htmlFor={`${mode}-email`}>Email address</Label>
        <Input
          id={`${mode}-email`}
          type="email"
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            clearField("email");
          }}
          placeholder="you@example.com"
          className="mt-2"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? emailErrorId : undefined}
        />
        {errors.email && (
          <p
            id={emailErrorId}
            role="alert"
            className="mt-1 text-sm text-danger"
          >
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor={`${mode}-password`}>Password</Label>
        <Input
          id={`${mode}-password`}
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          spellCheck={false}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            clearField("password");
          }}
          placeholder={isRegister ? "At least 8 characters" : "Your password"}
          className="mt-2"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={
            errors.password ? `${mode}-password-error` : undefined
          }
        />
        {errors.password && (
          <p
            id={`${mode}-password-error`}
            role="alert"
            className="mt-1 text-sm text-danger"
          >
            {errors.password}
          </p>
        )}
      </div>

      {isRegister && (
        // Honeypot: off-screen and out of the tab order; people never see or fill it.
        <div
          aria-hidden="true"
          className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
        >
          <label htmlFor={`${mode}-website`}>Website</label>
          <input
            id={`${mode}-website`}
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />
        </div>
      )}
      {submitError && (
        <p role="alert" className="text-sm leading-relaxed text-danger">
          {submitError}
        </p>
      )}

      <Button type="submit" disabled={pending} className="h-10 w-full">
        {pending
          ? isRegister
            ? "Creating account…"
            : "Logging in…"
          : isRegister
            ? "Create free account"
            : "Log in"}
        {!pending && <LogIn className="ml-2 size-4" aria-hidden="true" />}
      </Button>
    </form>
  );
}
