"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AuthForm, type AuthMode } from "@/components/auth/AuthForm";
import type { AuthUser } from "@/components/auth/authClient";

export interface HeroProps {
  /** The signed-in user, or null when logged out; undefined while the session is loading. */
  user: AuthUser | null | undefined;
  onAuthSuccess: (user: AuthUser) => void;
  onStartBlank: () => void;
}

export function Hero({ user, onAuthSuccess, onStartBlank }: HeroProps) {
  const [mode, setMode] = useState<AuthMode>("register");
  const authed = user !== undefined;
  const signedIn = authed && user !== null;

  return (
    <section
      aria-label="Welcome"
      className="mx-auto w-full max-w-6xl px-5 py-16 md:px-10 md:py-20"
    >
      <div className="max-w-4xl">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div>
            <p className="mb-5 text-xs font-medium uppercase tracking-[0.18em] text-accent">
              A private room for your work
            </p>
            <h1 className="font-display text-5xl font-semibold leading-[0.98] tracking-[-0.04em] md:text-6xl">
              Draw a room.
              <br />
              Hang your work.
              <br />
              Open the doors.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-pencil">
              Galleriverse turns a simple floor plan into a 3D space anyone can
              walk through from a link.
            </p>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-pencil">
              Create a free gallery workspace to save your rooms, arrange your
              work, and share the finished space.
            </p>
          </div>

          {signedIn ? (
            <div className="border border-hairline bg-paper p-6 md:p-7">
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                Welcome back.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-pencil">
                Pick up where you left off.
              </p>
              <Button onClick={onStartBlank} className="mt-6 h-10 w-full">
                Create a gallery
                <Plus className="ml-2 size-4" aria-hidden="true" />
              </Button>
            </div>
          ) : (
            <div className="border border-hairline bg-paper p-6 md:p-7">
              {authed ? (
                <>
                  <div
                    role="tablist"
                    aria-label="Register or log in"
                    className="mb-6 flex border-b border-hairline"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={mode === "register"}
                      onClick={() => setMode("register")}
                      className={`flex-1 border-b-2 pb-3 text-sm font-medium transition-colors ${
                        mode === "register"
                          ? "border-accent text-graphite"
                          : "border-transparent text-pencil hover:text-graphite"
                      }`}
                    >
                      New here
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={mode === "login"}
                      onClick={() => setMode("login")}
                      className={`flex-1 border-b-2 pb-3 text-sm font-medium transition-colors ${
                        mode === "login"
                          ? "border-accent text-graphite"
                          : "border-transparent text-pencil hover:text-graphite"
                      }`}
                    >
                      Returning
                    </button>
                  </div>
                  <div className="mb-5">
                    <h2 className="text-xl font-semibold tracking-[-0.02em]">
                      {mode === "register"
                        ? "Make space for your work."
                        : "Pick up where you left off."}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-pencil">
                      {mode === "register"
                        ? "No code. No 3D skills. Just your ideas."
                        : "Your rooms and artwork are waiting."}
                    </p>
                  </div>
                  <AuthForm key={mode} mode={mode} onSuccess={onAuthSuccess} />
                  <p className="mt-4 text-center text-xs leading-relaxed text-pencil">
                    By continuing, you agree to make beautiful things.
                  </p>
                </>
              ) : (
                <p className="text-sm text-pencil">Checking…</p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
