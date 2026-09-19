"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { loginAction } from "@/server/actions/auth";

export function LoginForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(loginAction, null);
  const errorRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"idle" | "auth" | "ok">("idle");
  const invalid = Boolean(state && "error" in state && state.error);

  useEffect(() => {
    if (state && "error" in state && state.error) errorRef.current?.focus();
  }, [state]);

  useEffect(() => {
    if (pending) setPhase("auth");
  }, [pending]);

  useEffect(() => {
    if (state && "error" in state && state.error) setPhase("idle");
  }, [state]);

  useEffect(() => {
    if (!state || !("ok" in state) || !state.ok) return;
    setPhase("ok");
    const t = setTimeout(() => router.replace("/dashboard"), 1200);
    return () => clearTimeout(t);
  }, [state, router]);

  const field =
    "h-12 w-full rounded-2xl border border-[#e6e8eb] bg-white px-4 text-[14px] text-[#111827] outline-none transition-colors duration-150 focus-visible:border-[#9aa3af] focus-visible:ring-2 focus-visible:ring-[#9aa3af]/20";

  return (
    <div className="relative mt-7 min-h-[248px]">
      {phase !== "idle" ? (
        <div
          className="absolute inset-0 z-10 grid place-items-center rounded-2xl bg-white"
          role="status"
          aria-live="polite"
        >
          {phase === "auth" ? (
            <div className="flex flex-col items-center gap-3">
              <span className="login-motion size-10 animate-spin rounded-full border-[3px] border-[#e4e7ec] border-t-[#111111]" />
              <p className="text-[14px] font-medium text-[#111111]">Authenticating</p>
            </div>
          ) : (
            <div className="login-check-pop login-motion flex flex-col items-center gap-3">
              <span className="grid size-14 place-items-center rounded-full bg-[#22c55e]">
                <svg viewBox="0 0 24 24" className="size-8" fill="none" aria-hidden>
                  <path
                    className="login-check-draw login-motion"
                    d="M6 12.5L10.2 16.5L18 8"
                    stroke="white"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          )}
        </div>
      ) : null}

      <form action={action} className="space-y-4" aria-busy={pending || phase !== "idle"}>
        {state && "error" in state && state.error ? (
          <div
            ref={errorRef}
            id="login-error"
            role="alert"
            tabIndex={-1}
            className="rounded-2xl border border-[#fda29b] bg-[#fef3f2] px-4 py-3 text-[13px] text-[#b42318] outline-none"
          >
            {state.error}
          </div>
        ) : null}

        <div className="space-y-2">
          <label htmlFor="email" className="block text-[13px] font-medium text-[#374151]">
            Username
          </label>
          <input
            id="email"
            name="email"
            type="text"
            required
            autoComplete="username"
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? "login-error" : undefined}
            suppressHydrationWarning
            className={field}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="block text-[13px] font-medium text-[#374151]">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? "login-error" : undefined}
            suppressHydrationWarning
            className={field}
          />
        </div>
        <button
          type="submit"
          disabled={pending || phase !== "idle"}
          className="mt-1 flex h-12 w-full items-center justify-between rounded-2xl bg-[#111111] px-5 text-[14px] font-medium text-white transition-colors duration-150 hover:bg-black disabled:opacity-50"
        >
          {pending ? "Opening…" : "Open workspace"}
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </form>
    </div>
  );
}
