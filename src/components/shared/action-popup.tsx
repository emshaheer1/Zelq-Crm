"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";

type Kind = "ok" | "err";
type Notice = { kind: Kind; message: string };
type Ask = {
  title: string;
  body: string;
  confirmLabel: string;
  resolve: (ok: boolean) => void;
};

let emit: ((notice: Notice) => void) | null = null;
let emitAsk: ((ask: Ask | null) => void) | null = null;

export function actionOk(message: string) {
  emit?.({ kind: "ok", message });
}

export function actionErr(message: string) {
  emit?.({ kind: "err", message });
}

export function actionCatch(error: unknown, fallback = "Something went wrong. Please try again.") {
  const message = error instanceof Error ? error.message : "";
  if (/Minified React error|Server Components render|digest/i.test(message)) return;
  actionErr(message || fallback);
}

export function actionAsk(title: string, body = "This cannot be undone.", confirmLabel = "Delete") {
  return new Promise<boolean>((resolve) => {
    if (!emitAsk) {
      resolve(false);
      return;
    }
    emitAsk({ title, body, confirmLabel, resolve });
  });
}

export function ActionPopup() {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [ask, setAsk] = useState<Ask | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    emit = setNotice;
    emitAsk = setAsk;
    return () => {
      emit = null;
      emitAsk = null;
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), notice.kind === "ok" ? 2000 : 2600);
    return () => clearTimeout(timer);
  }, [notice]);

  if (!mounted) return null;

  return createPortal(
    <>
      {ask ? (
        <div className="fixed inset-0 z-[400] grid place-items-center bg-black/40 p-4">
          <div className="login-check-pop login-motion w-full max-w-sm rounded-2xl bg-white px-6 py-8 text-center shadow-[0_16px_40px_rgba(16,24,40,0.16)]">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#B42318] text-2xl font-semibold text-white">
              !
            </span>
            <p className="mt-3 text-base font-semibold text-[#111827]">{ask.title}</p>
            <p className="mt-1 text-sm text-[#667085]">{ask.body}</p>
            <div className="mt-5 flex justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  ask.resolve(false);
                  setAsk(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  ask.resolve(true);
                  setAsk(null);
                }}
              >
                {ask.confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      {notice ? (
        <div className="fixed inset-0 z-[410] grid place-items-center bg-black/40 p-4">
          <div className="login-check-pop login-motion w-full max-w-sm rounded-2xl bg-white px-6 py-8 text-center shadow-[0_16px_40px_rgba(16,24,40,0.16)]">
            {notice.kind === "ok" ? (
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#22c55e]">
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
            ) : (
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#B42318] text-2xl font-semibold text-white">
                !
              </span>
            )}
            <p className="mt-3 text-base font-semibold text-[#111827]">{notice.message}</p>
          </div>
        </div>
      ) : null}
    </>,
    document.body,
  );
}
