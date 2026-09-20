"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type Kind = "ok" | "err";
type Notice = { kind: Kind; message: string };

let emit: ((notice: Notice) => void) | null = null;

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

export function ActionPopup() {
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    emit = setNotice;
    return () => {
      emit = null;
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), notice.kind === "ok" ? 1600 : 2200);
    return () => clearTimeout(timer);
  }, [notice]);

  return (
    <Dialog open={Boolean(notice)}>
      <DialogContent className="z-[80] max-w-sm text-center sm:max-w-sm" showCloseButton={false}>
        <div className="login-check-pop login-motion flex flex-col items-center gap-3 py-4">
          {notice?.kind === "ok" ? (
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
          ) : (
            <span className="grid size-14 place-items-center rounded-full bg-[#B42318] text-2xl font-semibold text-white">
              !
            </span>
          )}
          <DialogTitle className="text-base font-semibold text-[#111827]">
            {notice?.message}
          </DialogTitle>
        </div>
      </DialogContent>
    </Dialog>
  );
}
