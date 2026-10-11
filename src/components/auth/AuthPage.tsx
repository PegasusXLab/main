"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startBlankGallery } from "@/components/landing/startGallery";
import { authDestination, type AuthUser } from "./authClient";
import { AuthForm, type AuthMode } from "./AuthForm";

export interface AuthPageProps {
  mode: AuthMode;
}

export function AuthPage({ mode }: AuthPageProps) {
  const router = useRouter();
  const isRegister = mode === "register";

  function handleSuccess(user: AuthUser) {
    const destination = authDestination(user);
    if (destination === "/edit/local") startBlankGallery();
    router.push(destination);
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-plaster p-6 text-graphite">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="block font-display text-lg font-semibold tracking-[-0.02em]"
        >
          Galleriverse
        </Link>
        <div className="mt-6 border border-hairline bg-paper p-6 md:p-7">
          <h1 className="text-xl font-semibold tracking-[-0.02em]">
            {isRegister ? "Create your account" : "Log in"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-pencil">
            {isRegister
              ? "Make space for your work."
              : "Pick up where you left off."}
          </p>
          <div className="mt-5">
            <AuthForm mode={mode} onSuccess={handleSuccess} />
          </div>
        </div>
        <p className="mt-5 text-center text-sm text-pencil">
          {isRegister ? (
            <>
              Already have a gallery?{" "}
              <Link
                href="/login"
                className="font-medium text-accent underline-offset-2 hover:underline"
              >
                Log in
              </Link>
            </>
          ) : (
            <>
              New here?{" "}
              <Link
                href="/register"
                className="font-medium text-accent underline-offset-2 hover:underline"
              >
                Create a free account
              </Link>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
